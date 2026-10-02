import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES, translations } from '../utils/translations';
import { SupportedLanguage } from '../types';

describe('Comprehensive International Languages Evaluation Suite', () => {
  const unOfficialLanguages: SupportedLanguage[] = ['en', 'ar', 'zh', 'fr', 'ru', 'es'];
  const globalLanguages: SupportedLanguage[] = ['id', 'ja', 'ko', 'de', 'pt'];
  const allLanguages: SupportedLanguage[] = [...unOfficialLanguages, ...globalLanguages];

  // 1. UN Official Languages Verification
  describe('Pillar 1: UN Official Languages Structure', () => {
    it('verifies all 6 UN official languages are designated with isUN: true', () => {
      unOfficialLanguages.forEach(code => {
        const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
        expect(lang, `Language ${code} must be defined`).toBeDefined();
        expect(lang?.isUN, `Language ${code} must be flagged as UN official`).toBe(true);
      });
    });

    it('verifies Arabic language has right-to-left (RTL) direction', () => {
      const arabic = SUPPORTED_LANGUAGES.find(l => l.code === 'ar');
      expect(arabic).toBeDefined();
      expect(arabic?.dir).toBe('rtl');
    });

    it('verifies non-Arabic languages default to left-to-right (LTR) direction', () => {
      allLanguages.filter(code => code !== 'ar').forEach(code => {
        const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
        expect(lang?.dir).toBe('ltr');
      });
    });
  });

  // 2. Core UI Dictionary Evaluation across all 11 languages
  describe('Pillar 2: Core UI Dictionary Completeness (11 Languages)', () => {
    const requiredKeys = [
      'appName',
      'digitalClassroom',
      'whiteboard',
      'history',
      'settings',
      'save',
      'export',
      'share',
      'aiStatus',
      'askSomething',
      'interfaceLanguage',
      'aiConfig',
      'aboutTrido',
      'start',
      'pause',
      'reset',
      'clear'
    ];

    allLanguages.forEach(code => {
      it(`evaluates dictionary completeness for [${code}]`, () => {
        const dict = translations[code];
        expect(dict, `Dictionary for [${code}] must exist`).toBeDefined();

        requiredKeys.forEach(key => {
          const val = dict[key];
          expect(val, `Key "${key}" in [${code}] must be a non-empty string`).toBeTruthy();
          expect(typeof val, `Key "${key}" in [${code}] must be typeof string`).toBe('string');
          expect(val.trim().length, `Key "${key}" in [${code}] must have length > 0`).toBeGreaterThan(0);
        });
      });
    });
  });

  // 3. Native Script & Character Set Integrity
  describe('Pillar 3: Native Scripts & Character Set Integrity', () => {
    it('correctly handles Arabic script (العربية)', () => {
      const ar = translations['ar'];
      expect(ar.whiteboard).toBe('السبورة الذكية');
      expect(ar.digitalClassroom).toBe('الفصل الدراسي الرقمي');
      expect(ar.settings).toBe('الإعدادات');
      expect(/[\u0600-\u06FF]/.test(ar.whiteboard)).toBe(true);
    });

    it('correctly handles Simplified Chinese script (简体中文)', () => {
      const zh = translations['zh'];
      expect(zh.whiteboard).toBe('智能电子白板');
      expect(zh.digitalClassroom).toBe('数字化智能课堂');
      expect(zh.settings).toBe('系统设置');
      expect(/[\u4e00-\u9fa5]/.test(zh.whiteboard)).toBe(true);
    });

    it('correctly handles Cyrillic script (Русский)', () => {
      const ru = translations['ru'];
      expect(ru.whiteboard).toBe('Интерактивная Доска');
      expect(ru.digitalClassroom).toBe('Цифровой Класс');
      expect(ru.settings).toBe('Настройки');
      expect(/[\u0400-\u04FF]/.test(ru.whiteboard)).toBe(true);
    });

    it('correctly handles Japanese script (日本語 - Kanji & Kana)', () => {
      const ja = translations['ja'];
      expect(ja.whiteboard).toBe('ホワイトボード');
      expect(ja.settings).toBe('設定');
      expect(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(ja.whiteboard)).toBe(true);
    });

    it('correctly handles Korean script (한국어 - Hangul)', () => {
      const ko = translations['ko'];
      expect(ko.whiteboard).toBe('화이트보드');
      expect(ko.settings).toBe('설정');
      expect(/[\uAC00-\uD7AF]/.test(ko.whiteboard)).toBe(true);
    });

    it('correctly handles French accents & diacritics (Français)', () => {
      const fr = translations['fr'];
      expect(fr.digitalClassroom.toLowerCase()).toContain('numérique');
      expect(fr.settings).toContain('Paramètres');
    });

    it('correctly handles Spanish inverted punctuation & accents (Español)', () => {
      const es = translations['es'];
      expect(es.digitalClassroom).toBe('Aula Digital');
      expect(es.settings).toBe('Configuración');
    });

    it('correctly handles German compound words & umlauts (Deutsch)', () => {
      const de = translations['de'];
      expect(de.digitalClassroom).toContain('Digitales Klassenzimmer');
      expect(de.settings).toBe('Einstellungen');
    });

    it('correctly handles Portuguese diacritics (Português)', () => {
      const pt = translations['pt'];
      expect(pt.settings).toBe('Configurações');
      expect(pt.whiteboard).toContain('Quadro');
    });
  });

  // 4. Metadata Consistency
  describe('Pillar 4: Language Metadata Validation', () => {
    it('ensures each supported language has distinct code, flag, name, and nativeName', () => {
      const seenCodes = new Set<string>();
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(seenCodes.has(lang.code), `Duplicate code: ${lang.code}`).toBe(false);
        seenCodes.add(lang.code);

        expect(lang.flag).toBeTruthy();
        expect(lang.name).toBeTruthy();
        expect(lang.nativeName).toBeTruthy();
      });
      expect(seenCodes.size).toBe(11);
    });
  });
});
