import fs from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('telemetry');

export interface TelemetryRecord {
  id: string;
  timestamp: string; // ISO 8601
  timestampLocal: string; // Local WIB
  sessionId: string;
  endpoint: string;
  provider: 'vertex' | 'gemini' | 'ollama' | 'unknown';
  model: string;
  prompt: string;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  thinkingTokens: number;
  costUsd: number;
  costIdr: number;
  latencyMs: number;
  status: 'success' | 'error';
  errorCode?: string;
  errorMessage?: string;
  actionsCount: number;
  actionsSummary: string;
  responseTextSnippet: string;
  userRating?: 'good' | 'bad' | 'neutral' | null;
  userFeedback?: string | null;
  canvasObjectsCount?: number;
  domElementsCount?: number;
  sheetSyncStatus: 'synced' | 'pending' | 'failed' | 'disabled';
}

export interface TelemetrySummary {
  totalRequests: number;
  totalPromptTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  totalCostIdr: number;
  avgLatencyMs: number;
  successRate: number;
  providerCounts: Record<string, number>;
  modelCounts: Record<string, number>;
  syncedToSheetCount: number;
  pendingSheetCount: number;
}

export interface TelemetryConfig {
  googleSheetId?: string;
  googleSheetName?: string;
  googleSheetWebhookUrl?: string;
  autoSync: boolean;
}

// Model pricing per 1M tokens (USD)
const PRICING_PER_MILLION: Record<string, { input: number; output: number }> = {
  // Gemini 3.8 / 2.5 / 1.5 Flash tier
  'gemini-3.8-flash': { input: 0.15, output: 0.60 },
  'gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'gemini-1.5-flash': { input: 0.15, output: 0.60 },
  'gemini-flash': { input: 0.15, output: 0.60 },
  // Gemini Flash Lite tier
  'gemini-3.5-flash-lite': { input: 0.075, output: 0.30 },
  'gemini-2.5-flash-lite': { input: 0.075, output: 0.30 },
  'gemini-1.5-flash-8b': { input: 0.075, output: 0.30 },
  // Gemini Pro tier
  'gemini-3.8-pro': { input: 1.25, output: 5.00 },
  'gemini-2.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  // Ollama local / open weights
  'gemma4:e2b': { input: 0, output: 0 },
  'gemma4:31b': { input: 0, output: 0 },
  'gemma-4-31b-it': { input: 0, output: 0 },
  'ollama': { input: 0, output: 0 }
};

const USD_TO_IDR_RATE = 16300;
const TELEMETRY_DIR = path.join(process.cwd(), 'data');
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, 'trido_telemetry.json');
const CONFIG_FILE = path.join(TELEMETRY_DIR, 'telemetry_config.json');
const MAX_LOCAL_RECORDS = 5000;

class TelemetryService {
  private records: TelemetryRecord[] = [];
  private config: TelemetryConfig = {
    googleSheetId: process.env.GOOGLE_SHEET_ID || '',
    googleSheetName: process.env.GOOGLE_SHEET_NAME || 'Trido_Telemetry',
    googleSheetWebhookUrl: process.env.GOOGLE_SHEET_WEBHOOK_URL || '',
    autoSync: true
  };
  private isSaving = false;
  private pendingSave = false;
  private saveTimer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private enabled = false;

  constructor() {
    // Telemetry archived & stopped — zero disk writes and zero timers running
  }

  private initStorage() {
    try {
      if (!fs.existsSync(TELEMETRY_DIR)) {
        fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
      }
    } catch (e) {
      logger.error('Failed to create telemetry storage dir', e);
    }
  }

  private loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.config = { ...this.config, ...parsed };
      }
    } catch (e) {
      logger.warn('Failed to load telemetry config file, using env defaults', e);
    }
  }

  public saveConfig(newConfig: Partial<TelemetryConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      this.initStorage();
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
      logger.info('Telemetry config updated', this.config);
    } catch (e) {
      logger.error('Failed to save telemetry config', e);
    }
  }

  public getConfig(): TelemetryConfig {
    return { ...this.config };
  }

  private loadRecords() {
    try {
      if (fs.existsSync(TELEMETRY_FILE)) {
        const raw = fs.readFileSync(TELEMETRY_FILE, 'utf8');
        this.records = JSON.parse(raw);
        logger.info(`Loaded ${this.records.length} telemetry records from disk.`);
      }
    } catch (e) {
      logger.error('Failed to load telemetry records', e);
      this.records = [];
    }
  }

  private scheduleSave() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }
    if (this.saveTimer) return;

    this.saveTimer = setTimeout(async () => {
      this.saveTimer = null;
      this.isSaving = true;
      try {
        this.initStorage();
        if (this.records.length > MAX_LOCAL_RECORDS) {
          this.records = this.records.slice(-MAX_LOCAL_RECORDS);
        }
        const tmp = `${TELEMETRY_FILE}.tmp`;
        await fs.promises.writeFile(tmp, JSON.stringify(this.records, null, 2), 'utf8');
        await fs.promises.rename(tmp, TELEMETRY_FILE);
      } catch (e) {
        logger.error('Failed to save telemetry records to disk', e);
      } finally {
        this.isSaving = false;
        if (this.pendingSave) {
          this.pendingSave = false;
          this.scheduleSave();
        }
      }
    }, 1500);
    if (this.saveTimer.unref) {
      this.saveTimer.unref();
    }
  }

  public calculateCost(model: string, inputTokens: number, outputTokens: number): { costUsd: number; costIdr: number } {
    const cleanModel = (model || '').toLowerCase().trim();
    let pricing = PRICING_PER_MILLION[cleanModel];

    if (!pricing) {
      // Find fuzzy match
      const key = Object.keys(PRICING_PER_MILLION).find(k => cleanModel.includes(k) || k.includes(cleanModel));
      pricing = key ? PRICING_PER_MILLION[key] : { input: 0.15, output: 0.60 }; // Default to Flash pricing
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalUsd = Number((inputCost + outputCost).toFixed(6));
    const totalIdr = Number((totalUsd * USD_TO_IDR_RATE).toFixed(2));

    return { costUsd: totalUsd, costIdr: totalIdr };
  }

  private formatLocalTime(date: Date = new Date()): string {
    return date.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' WIB';
  }

  public recordEvent(params: {
    sessionId?: string;
    endpoint: string;
    provider: 'vertex' | 'gemini' | 'ollama' | 'unknown';
    model: string;
    prompt: string;
    promptTokens?: number;
    outputTokens?: number;
    thinkingTokens?: number;
    latencyMs: number;
    status: 'success' | 'error';
    errorCode?: string;
    errorMessage?: string;
    functionCalls?: any[];
    responseText?: string;
    canvasObjectsCount?: number;
    domElementsCount?: number;
  }): TelemetryRecord {
    if (!this.enabled) {
      return {
        id: `tel_archived_${Date.now()}`,
        timestamp: new Date().toISOString(),
        timestampLocal: new Date().toLocaleString('id-ID'),
        sessionId: params.sessionId || 'session_archived',
        endpoint: params.endpoint || '/api/ai/generate',
        prompt: (params.prompt || '').slice(0, 100),
        model: params.model || 'gemini-3.8-flash',
        provider: params.provider || 'vertex',
        promptTokens: 0,
        outputTokens: 0,
        thinkingTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        costIdr: 0,
        latencyMs: params.latencyMs || 0,
        status: params.status || 'success',
        actionsCount: (params.functionCalls || []).length,
        actionsSummary: '',
        responseTextSnippet: '',
        sheetSyncStatus: 'disabled'
      };
    }

    const now = new Date();
    const promptTok = Number(params.promptTokens || 0);
    const outputTok = Number(params.outputTokens || 0);
    const thinkingTok = Number(params.thinkingTokens || 0);
    const totalTok = promptTok + outputTok;
    const { costUsd, costIdr } = this.calculateCost(params.model, promptTok, outputTok);

    const calls = params.functionCalls || [];
    const actionCounts: Record<string, number> = {};
    calls.forEach((c: any) => {
      const name = c.name || c.function?.name || 'action';
      actionCounts[name] = (actionCounts[name] || 0) + 1;
    });
    const actionsSummary = Object.entries(actionCounts)
      .map(([k, v]) => `${k} (${v})`)
      .join(', ') || (calls.length > 0 ? `${calls.length} aksi` : 'Tidak ada');

    const snippet = (params.responseText || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);

    const cleanPrompt = (params.prompt || '').trim();

    const record: TelemetryRecord = {
      id: `tel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.toISOString(),
      timestampLocal: this.formatLocalTime(now),
      sessionId: params.sessionId || 'session_default',
      endpoint: params.endpoint,
      provider: params.provider,
      model: params.model,
      prompt: cleanPrompt,
      promptTokens: promptTok,
      outputTokens: outputTok,
      totalTokens: totalTok,
      thinkingTokens: thinkingTok,
      costUsd,
      costIdr,
      latencyMs: params.latencyMs,
      status: params.status,
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
      actionsCount: calls.length,
      actionsSummary,
      responseTextSnippet: snippet,
      canvasObjectsCount: params.canvasObjectsCount || 0,
      domElementsCount: params.domElementsCount || 0,
      sheetSyncStatus: (this.config.googleSheetWebhookUrl || this.config.googleSheetId) && this.config.autoSync ? 'pending' : 'disabled'
    };

    this.records.push(record);
    this.scheduleSave();

    // Google Cloud Structured Logging emission
    this.emitCloudLogging(record);

    // If autoSync enabled, push asynchronously
    if (record.sheetSyncStatus === 'pending') {
      this.syncRecordToGoogleSheet(record).catch(err => {
        logger.warn('Initial live sync error (queued for next batch)', err.message);
      });
    }

    return record;
  }

  private emitCloudLogging(record: TelemetryRecord) {
    const isCloudEnv = !!(process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID || process.env.K_SERVICE);
    if (!isCloudEnv && process.env.NODE_ENV !== 'production') return;

    try {
      const payload = {
        severity: record.status === 'success' ? 'INFO' : 'ERROR',
        message: `[Trido AI Telemetry] ${record.provider}/${record.model} - ${record.totalTokens} tokens - $${record.costUsd.toFixed(6)} (${record.latencyMs}ms)`,
        'logging.googleapis.com/labels': {
          project: 'gemma4good-494311',
          service: 'trido-ai',
          provider: record.provider,
          model: record.model,
          status: record.status,
          endpoint: record.endpoint
        },
        telemetry: {
          id: record.id,
          timestamp: record.timestamp,
          tokens: {
            prompt: record.promptTokens,
            output: record.outputTokens,
            total: record.totalTokens,
            thinking: record.thinkingTokens
          },
          cost: {
            usd: record.costUsd,
            idr: record.costIdr
          },
          performance: {
            latencyMs: record.latencyMs
          },
          promptSnippet: record.prompt.slice(0, 100),
          actionsCount: record.actionsCount,
          actionsSummary: record.actionsSummary,
          error: record.errorMessage || null
        }
      };
      // Format as single-line JSON for Cloud Logging agent / stdout
      console.log(JSON.stringify(payload));
    } catch {
      // Ignore logging serialization errors
    }
  }

  public recordFeedback(logId: string, rating: 'good' | 'bad' | 'neutral', feedback?: string): boolean {
    const record = this.records.find(r => r.id === logId);
    if (!record) return false;

    record.userRating = rating;
    if (feedback !== undefined) {
      record.userFeedback = feedback;
    }
    // Re-queue to sync updated feedback to Google Sheet
    if (this.config.googleSheetWebhookUrl || this.config.googleSheetId) {
      record.sheetSyncStatus = 'pending';
      this.syncRecordToGoogleSheet(record).catch(() => {});
    }

    this.scheduleSave();
    return true;
  }

  public getSummary(): TelemetrySummary {
    const totalRequests = this.records.length;
    let totalPromptTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let totalCostUsd = 0;
    let totalCostIdr = 0;
    let totalLatency = 0;
    let successCount = 0;
    let syncedToSheetCount = 0;
    let pendingSheetCount = 0;
    const providerCounts: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};

    for (const r of this.records) {
      totalPromptTokens += r.promptTokens || 0;
      totalOutputTokens += r.outputTokens || 0;
      totalTokens += r.totalTokens || 0;
      totalCostUsd += r.costUsd || 0;
      totalCostIdr += r.costIdr || 0;
      totalLatency += r.latencyMs || 0;
      if (r.status === 'success') successCount++;
      if (r.sheetSyncStatus === 'synced') syncedToSheetCount++;
      if (r.sheetSyncStatus === 'pending') pendingSheetCount++;

      providerCounts[r.provider] = (providerCounts[r.provider] || 0) + 1;
      modelCounts[r.model] = (modelCounts[r.model] || 0) + 1;
    }

    return {
      totalRequests,
      totalPromptTokens,
      totalOutputTokens,
      totalTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(6)),
      totalCostIdr: Math.round(totalCostIdr),
      avgLatencyMs: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
      successRate: totalRequests > 0 ? Number(((successCount / totalRequests) * 100).toFixed(1)) : 100,
      providerCounts,
      modelCounts,
      syncedToSheetCount,
      pendingSheetCount
    };
  }

  public getRecentRecords(limit = 100): TelemetryRecord[] {
    return this.records.slice(-limit).reverse();
  }

  public getAllRecords(): TelemetryRecord[] {
    return [...this.records];
  }

  // ── CSV Export ─────────────────────────────────────────────────────────────
  public generateCsv(): string {
    const headers = [
      'ID Log',
      'Waktu (WIB)',
      'Waktu (ISO)',
      'ID Sesi',
      'Endpoint',
      'Provider AI',
      'Model',
      'Prompt',
      'Input Tokens',
      'Output Tokens',
      'Total Tokens',
      'Thinking Tokens',
      'Biaya (USD)',
      'Biaya (IDR)',
      'Latensi (ms)',
      'Status',
      'Jumlah Aksi',
      'Aksi & Alat AI',
      'Ringkasan Respon',
      'UX Rating',
      'UX Feedback',
      'Error Detail',
      'Status Sync Sheet'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = this.records.map(r => [
      escapeCsv(r.id),
      escapeCsv(r.timestampLocal),
      escapeCsv(r.timestamp),
      escapeCsv(r.sessionId),
      escapeCsv(r.endpoint),
      escapeCsv(r.provider),
      escapeCsv(r.model),
      escapeCsv(r.prompt),
      r.promptTokens,
      r.outputTokens,
      r.totalTokens,
      r.thinkingTokens || 0,
      r.costUsd.toFixed(6),
      Math.round(r.costIdr),
      r.latencyMs,
      escapeCsv(r.status),
      r.actionsCount,
      escapeCsv(r.actionsSummary),
      escapeCsv(r.responseTextSnippet),
      escapeCsv(r.userRating || ''),
      escapeCsv(r.userFeedback || ''),
      escapeCsv(r.errorMessage || ''),
      escapeCsv(r.sheetSyncStatus)
    ].join(','));

    // UTF-8 BOM for automatic Excel / Google Sheets character recognition
    return '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  }

  // ── Google Sheets Sync ─────────────────────────────────────────────────────
  public async syncRecordToGoogleSheet(record: TelemetryRecord): Promise<boolean> {
    // 1. Try Google Apps Script Webhook first if configured (most friction-free)
    if (this.config.googleSheetWebhookUrl) {
      try {
        const response = await fetch(this.config.googleSheetWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'append_row',
            sheetName: this.config.googleSheetName || 'Trido_Telemetry',
            row: {
              id: record.id,
              timestampLocal: record.timestampLocal,
              timestamp: record.timestamp,
              sessionId: record.sessionId,
              endpoint: record.endpoint,
              provider: record.provider,
              model: record.model,
              prompt: record.prompt,
              promptTokens: record.promptTokens,
              outputTokens: record.outputTokens,
              totalTokens: record.totalTokens,
              costUsd: record.costUsd,
              costIdr: record.costIdr,
              latencyMs: record.latencyMs,
              status: record.status,
              actionsSummary: record.actionsSummary,
              responseTextSnippet: record.responseTextSnippet,
              userRating: record.userRating || '',
              userFeedback: record.userFeedback || '',
              errorMessage: record.errorMessage || ''
            }
          })
        });

        if (response.ok) {
          record.sheetSyncStatus = 'synced';
          this.scheduleSave();
          return true;
        } else {
          logger.warn(`Webhook sync failed: HTTP ${response.status}`);
          record.sheetSyncStatus = 'failed';
        }
      } catch (err: any) {
        logger.warn('Google Sheet Webhook sync error', err.message);
        record.sheetSyncStatus = 'failed';
      }
    }

    // 2. Try Google Sheets API v4 with Service Account / ADC
    if (this.config.googleSheetId) {
      try {
        const { getAuthClient } = await import('./vertexAdapter');
        const auth = await getAuthClient();
        const client = await auth.getClient();
        const tokenRes = await client.getAccessToken();
        const token = tokenRes.token;

        const sheetId = this.config.googleSheetId;
        const sheetName = this.config.googleSheetName || 'Trido_Telemetry';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

        const rowValues = [
          record.id,
          record.timestampLocal,
          record.sessionId,
          record.provider,
          record.model,
          record.prompt,
          record.promptTokens,
          record.outputTokens,
          record.totalTokens,
          record.costUsd.toFixed(6),
          Math.round(record.costIdr),
          record.latencyMs,
          record.status,
          record.actionsSummary,
          record.responseTextSnippet,
          record.userRating || '',
          record.userFeedback || '',
          record.errorMessage || ''
        ];

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [rowValues]
          })
        });

        if (response.ok) {
          record.sheetSyncStatus = 'synced';
          this.scheduleSave();
          return true;
        } else {
          const errData = await response.json().catch(() => ({}));
          logger.warn('Google Sheets API append failed', errData);
          record.sheetSyncStatus = 'failed';
        }
      } catch (err: any) {
        logger.warn('Google Sheets API sync error', err.message);
        record.sheetSyncStatus = 'failed';
      }
    }

    return false;
  }

  public async syncPending(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    this.isSyncing = true;

    let synced = 0;
    let failed = 0;

    try {
      const pendingRecords = this.records.filter(r => r.sheetSyncStatus === 'pending' || r.sheetSyncStatus === 'failed');
      for (const record of pendingRecords) {
        const ok = await this.syncRecordToGoogleSheet(record);
        if (ok) {
          synced++;
        } else {
          failed++;
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }

  private startPeriodicSync() {
    // Run sync batch every 60 seconds
    this.syncTimer = setInterval(() => {
      if (this.config.autoSync && (this.config.googleSheetWebhookUrl || this.config.googleSheetId)) {
        this.syncPending().catch(() => {});
      }
    }, 60_000);
    if (this.syncTimer.unref) {
      this.syncTimer.unref();
    }
  }

  // Turnkey Google Apps Script Code snippet for users
  public getAppsScriptCode(): string {
    return `// =====================================================================
// TRIDO DIGITAL CLASSROOM - GOOGLE APPS SCRIPT LIVE TELEMETRY RECEIVER
// Paste this into Extensions > Apps Script in your Google Sheet,
// then click "Deploy" > "New deployment" > "Web app"
// Who has access: "Anyone"
// Copy the Web App URL and paste it into Trido Settings!
// =====================================================================

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "";
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = data.sheetName || "Trido_Telemetry";
    var sheet = ss.getSheetByName(sheetName);
    
    var headers = [
      "ID Log", "Waktu (WIB)", "Waktu (ISO)", "ID Sesi", "Endpoint",
      "Provider AI", "Model", "Prompt User", "Input Tokens", "Output Tokens",
      "Total Tokens", "Biaya (USD)", "Biaya (IDR)", "Latensi (ms)", "Status",
      "Aksi & Tools", "Ringkasan Respon AI", "UX Rating", "UX Feedback", "Error"
    ];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#2563eb").setFontColor("#ffffff").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    
    var r = data.row || {};
    var rowData = [
      r.id || "",
      r.timestampLocal || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      r.timestamp || new Date().toISOString(),
      r.sessionId || "",
      r.endpoint || "",
      r.provider || "",
      r.model || "",
      r.prompt || "",
      r.promptTokens || 0,
      r.outputTokens || 0,
      r.totalTokens || 0,
      r.costUsd || 0,
      r.costIdr || 0,
      r.latencyMs || 0,
      r.status || "success",
      r.actionsSummary || "",
      r.responseTextSnippet || "",
      r.userRating || "",
      r.userFeedback || "",
      r.errorMessage || ""
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Row appended" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    service: "Trido Telemetry Webhook",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
  }
}

export const telemetryService = new TelemetryService();
