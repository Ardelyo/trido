import { useState, useEffect } from 'react';
import type React from 'react';
import { toPng } from 'html-to-image';
import { useStore } from '../store';
import { toast } from '../utils/toast';
import {
  exportSafeCompositePNG,
  copyImageToClipboard,
  getBoardContentBoundingBox,
  downloadFile
} from '../utils/smartExport';

/**
 * Export / import logic for the board (PNG, SVG, PDF, project JSON, image insert).
 * Extracted from ExportDialog so the dialog stays presentational.
 */
export function useBoardExport(isOpen: boolean, onClose: () => void, canvasRef: React.RefObject<any>) {
  const { pages, currentPageIndex, domElements, activeMindmapNodes, importProjectSession } = useStore();
  const [bgColor, setBgColor] = useState<'#ffffff' | '#0f172a' | 'transparent'>('#ffffff');
  const [multiplier, setMultiplier] = useState<1 | 2 | 4>(2);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string>('');
  const [pendingImportData, setPendingImportData] = useState<any | null>(null);

  // Generate live visual preview snapshot capturing BOTH canvas and DOM smartboard widgets
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    const generatePreview = async () => {
      // 1. Try capturing composite stage with all widgets (Mindmaps, Document Blocks, Quizzes, Simulations)
      const stage = document.getElementById('smartboard-stage-container');
      if (stage) {
        try {
          const dataUrl = await toPng(stage, {
            skipFonts: true,
            backgroundColor: bgColor === 'transparent' ? undefined : bgColor,
            pixelRatio: 0.6,
            cacheBust: true,
            filter: (node: any) => {
              if (node.classList && (node.classList.contains('agent-cursor') || node.classList.contains('exclude-export'))) {
                return false;
              }
              return true;
            }
          });
          if (!isCancelled && dataUrl && dataUrl.length > 500) {
            setLivePreviewUrl(dataUrl);
            return;
          }
        } catch (err) {
          console.warn('Live preview stage capture fallback to canvas:', err);
        }
      }

      // 2. Fallback to canvas.toDataURL
      if (canvasRef.current && !isCancelled) {
        try {
          const canvas = canvasRef.current;
          const dataUrl = canvas.toDataURL({
            format: 'png',
            multiplier: 0.5
          });
          setLivePreviewUrl(dataUrl);
        } catch (e) {
          console.warn('Failed to generate live preview snapshot:', e);
        }
      }
    };

    generatePreview();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, canvasRef.current, bgColor, domElements, activeMindmapNodes]);

  // ── 1. EXPORT SAFE COMPOSITE PNG (Anti Layar Hitam) ──────────────────────
  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    try {
      const dataURL = await exportSafeCompositePNG(canvasRef.current, domElements, {
        backgroundColor: bgColor,
        multiplier
      });
      downloadFile(dataURL, `trido_papan_${multiplier === 4 ? '4K_' : multiplier === 2 ? 'HD_' : ''}${Date.now()}.png`, 'image/png');
      toast.success(`Gambar PNG (${multiplier}x) berhasil diekspor.`);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengekspor gambar PNG.');
    }
  };

  // ── 2. COPY IMAGE TO CLIPBOARD ───────────────────────────────────────────
  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      const dataURL = await exportSafeCompositePNG(canvasRef.current, domElements, {
        backgroundColor: bgColor,
        multiplier: 2
      });
      const ok = await copyImageToClipboard(dataURL);
      if (ok) {
        setCopiedImage(true);
        toast.success('Gambar disalin ke clipboard! Siap ditempel (Ctrl+V) ke WhatsApp, Word, Canva.');
        setTimeout(() => setCopiedImage(false), 2000);
      } else {
        toast.error('Browser tidak mengizinkan salin gambar langsung.');
      }
    } catch (err: any) {
      toast.error('Gagal menyalin gambar.');
    }
  };

  // ── 3. EXPORT SVG DENGAN BOUNDING BOX ─────────────────────────────────────
  const handleExportSVG = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    try {
      const bounds = getBoardContentBoundingBox(canvas, domElements);
      let svg = canvas.toSVG({
        viewBox: {
          x: bounds.left,
          y: bounds.top,
          width: bounds.width,
          height: bounds.height
        }
      });

      if (bgColor !== 'transparent') {
        svg = svg.replace('<svg ', `<svg style="background-color: ${bgColor};" `);
      }

      downloadFile(svg, `trido_vektor_${Date.now()}.svg`, 'image/svg+xml;charset=utf-8');
      toast.success('Vektor SVG berhasil diekspor.');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengekspor vektor SVG.');
    }
  };

  // ── 4. EXPORT A4 PDF DOCUMENT ────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    setIsExportingPdf(true);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const dataURL = await exportSafeCompositePNG(canvasRef.current, domElements, {
        backgroundColor: '#ffffff',
        multiplier: 2
      });

      const pdfDoc = await PDFDocument.create();
      // A4 landscape: 842 x 595 pt
      const page = pdfDoc.addPage([842, 595]);

      const pngImageBytes = await fetch(dataURL).then(res => res.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngImageBytes);

      const margin = 28;
      const maxWidth = 842 - margin * 2;
      const maxHeight = 595 - margin * 2;

      let drawWidth = maxWidth;
      let drawHeight = (pngImage.height / pngImage.width) * drawWidth;

      if (drawHeight > maxHeight) {
        drawHeight = maxHeight;
        drawWidth = (pngImage.width / pngImage.height) * drawHeight;
      }

      const x = margin + (maxWidth - drawWidth) / 2;
      const y = margin + (maxHeight - drawHeight) / 2;

      page.drawImage(pngImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight
      });

      const pdfBytes = await pdfDoc.save();
      downloadFile(new Blob([pdfBytes], { type: 'application/pdf' }), `trido_dokumen_A4_${Date.now()}.pdf`, 'application/pdf');

      toast.success('Dokumen PDF A4 siap cetak berhasil dibuat.');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal membuat dokumen PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ── 5. EXPORT PROJECT JSON / .TRIDO ──────────────────────────────────────
  const handleExportJSON = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const currentCanvasJson = canvas.toJSON(['id', 'zIndex', 'isDomPlaceholder']);

    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = {
      canvas: currentCanvasJson,
      dom: domElements,
      previewDataUrl: livePreviewUrl || canvas.toDataURL({ format: 'png', multiplier: 0.2 }),
      mindmapNodes: activeMindmapNodes
    };

    const exportData = {
      app: 'trido',
      version: '1.0.0',
      exportedAt: Date.now(),
      title: `Trido Proyek - ${new Date().toLocaleDateString('id-ID')}`,
      pages: updatedPages,
      currentPageIndex,
      messages: useStore.getState().messages,
      lessonPlan: useStore.getState().lessonPlan
    };

    downloadFile(JSON.stringify(exportData, null, 2), `trido_cadangan_${Date.now()}.trido.json`, 'application/json');
    toast.success('Berkas cadangan proyek Trido (.trido) berhasil diunduh!');
    onClose();
  };

  // ── 6. INSPECT & IMPORT PROJECT FILE (Flexible Multi-Format) ───────────
  const handleProjectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Route image files directly to canvas insertion
    if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(file.name)) {
      handleImageFileChange(e);
      return;
    }

    try {
      const text = await file.text();
      let parsed = JSON.parse(text);

      // 1. Standard Trido project with multi-page structure
      if (parsed.pages && Array.isArray(parsed.pages)) {
        // already valid
      } else if (parsed.objects && Array.isArray(parsed.objects)) {
        // 2. Raw Fabric.js canvas export
        parsed = {
          title: file.name.replace(/\.[^/.]+$/, ''),
          pages: [{ canvas: parsed, dom: {} }],
          currentPageIndex: 0
        };
      } else if (parsed.canvas) {
        // 3. Single canvas wrapper
        parsed = {
          title: parsed.title || file.name.replace(/\.[^/.]+$/, ''),
          pages: [{ canvas: parsed.canvas, dom: parsed.dom || {} }],
          currentPageIndex: 0
        };
      } else {
        // Fallback: wrap into generic page
        parsed = {
          title: file.name.replace(/\.[^/.]+$/, ''),
          pages: [{ canvas: parsed, dom: {} }],
          currentPageIndex: 0
        };
      }

      setPendingImportData({
        fileName: file.name,
        sizeKb: (file.size / 1024).toFixed(1),
        title: parsed.title || 'Proyek Tanpa Judul',
        pageCount: parsed.pages.length,
        exportedAt: parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleDateString('id-ID') : 'Sesi Eksternal',
        raw: parsed
      });
    } catch (err: any) {
      toast.error('Berkas tidak dapat dibaca: ' + (err?.message || 'Pastikan format JSON atau .trido valid'));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleApplyImport = async () => {
    if (!pendingImportData) return;
    setIsImporting(true);
    try {
      await importProjectSession(pendingImportData.raw);
      toast.success(`Proyek "${pendingImportData.title}" berhasil dimuat ke papan!`);
      setPendingImportData(null);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menerapkan berkas proyek.');
    } finally {
      setIsImporting(false);
    }
  };

  // ── 7. INSERT IMAGE DIRECTLY ONTO CANVAS ─────────────────────────────────
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current || !window.fabric) return;

    const canvas = canvasRef.current;
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      window.fabric.Image.fromURL(dataUrl, (img: any) => {
        if (!img) {
          toast.error('Gagal memuat gambar.');
          return;
        }

        const maxDim = 400;
        let scale = 1;
        if (img.width > maxDim || img.height > maxDim) {
          scale = maxDim / Math.max(img.width, img.height);
        }

        const center = canvas.getCenter();
        img.set({
          left: center.left - (img.width * scale) / 2,
          top: center.top - (img.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          cornerColor: '#1550aa',
          cornerStyle: 'circle',
          borderColor: '#1550aa',
          transparentCorners: false
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        toast.success('Gambar berhasil disisipkan ke papan tulis!');
        onClose();
      });
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return {
    bgColor, setBgColor,
    multiplier, setMultiplier,
    isExportingPdf, isImporting, copiedImage,
    livePreviewUrl,
    pendingImportData, setPendingImportData,
    handleExportPNG, handleCopyImage, handleExportSVG, handleExportPDF,
    handleExportJSON, handleProjectFileChange, handleApplyImport, handleImageFileChange,
  };
}
