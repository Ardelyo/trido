import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES, translations } from '../utils/translations';
import { SupportedLanguage } from '../types';

describe('Multilingual Internationalization (UN & Global Languages)', () => {
  const unLanguages: SupportedLanguage[] = ['en', 'ar', 'zh', 'fr', 'ru', 'es'];
  const globalLanguages: SupportedLanguage[] = ['id', 'ja', 'ko', 'de', 'pt'];
  const allLanguages: SupportedLanguage[] = [...unLanguages, ...globalLanguages];

  it('supports all 6 United Nations official languages', () => {
    unLanguages.forEach(code => {
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === code);
      expect(langInfo, `UN language ${code} should be defined in SUPPORTED_LANGUAGES`).toBeDefined();
      expect(langInfo?.isUN).toBe(true);
      expect(translations[code], `Translation dictionary for ${code} should exist`).toBeDefined();
    });
  });

  it('supports major international & regional languages', () => {
    globalLanguages.forEach(code => {
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === code);
      expect(langInfo, `Global language ${code} should be defined in SUPPORTED_LANGUAGES`).toBeDefined();
      expect(translations[code], `Translation dictionary for ${code} should exist`).toBeDefined();
    });
  });

  // Test each language one by one
  allLanguages.forEach(langCode => {
    describe(`Language test: ${langCode}`, () => {
      it(`resolves core smartboard keys in ${langCode}`, () => {
        const dict = translations[langCode];
        expect(dict).toBeDefined();

        // Essential smartboard UI keys
        const essentialKeys = [
          'appName',
          'whiteboard',
          'save',
          'export',
          'settings',
          'aiStatus',
          'interfaceLanguage',
          'aiConfig'
        ];

        essentialKeys.forEach(key => {
          expect(dict[key], `Key "${key}" must be non-empty string in ${langCode}`).toBeTruthy();
          expect(typeof dict[key]).toBe('string');
        });
      });

      it(`has valid native name and flag icon in metadata for ${langCode}`, () => {
        const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
        expect(langInfo).toBeDefined();
        expect(langInfo?.flag).toBeTruthy();
        expect(langInfo?.nativeName).toBeTruthy();
        expect(langInfo?.name).toBeTruthy();
      });
    });
  });

  it('handles Arabic RTL direction metadata correctly', () => {
    const arabic = SUPPORTED_LANGUAGES.find(l => l.code === 'ar');
    expect(arabic?.dir).toBe('rtl');
    expect(arabic?.isUN).toBe(true);
  });
});
