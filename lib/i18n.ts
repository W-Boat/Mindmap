import { translations, Language } from './translations';

const LANGUAGE_KEY = 'mindmap_language';
const DEFAULT_LANGUAGE: Language = 'zh';

let currentLanguage: Language = DEFAULT_LANGUAGE;

// Initialize language from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved === 'en' || saved === 'zh') {
    currentLanguage = saved;
  }
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(language: Language): void {
  if (language === 'en' || language === 'zh') {
    currentLanguage = language;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_KEY, language);
    }
    // Trigger a storage event to notify other tabs/components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new StorageEvent('storage', {
        key: LANGUAGE_KEY,
        newValue: language,
      }));
    }
  }
}

export function getAvailableLanguages(): Language[] {
  return ['zh', 'en'];
}

type NestedObject = {
  [key: string]: string | NestedObject;
};

function getNestedValue(obj: NestedObject, path: string): string | undefined {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

export function t(key: string): string {
  const lang = getCurrentLanguage();
  const translationObj = translations[lang];

  const value = getNestedValue(translationObj, key);

  if (value) {
    return value;
  }

  // Fallback to English if key not found
  if (lang !== 'en') {
    const fallback = getNestedValue(translations.en, key);
    if (fallback) {
      return fallback;
    }
  }

  // If still not found, return the key itself
  return key;
}

export function setupLanguageListener(callback: (language: Language) => void): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === LANGUAGE_KEY && event.newValue) {
      const newLang = event.newValue as Language;
      if (newLang === 'en' || newLang === 'zh') {
        currentLanguage = newLang;
        callback(newLang);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}
