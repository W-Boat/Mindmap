import React, { useState, useEffect } from 'react';
import { getCurrentLanguage, setLanguage, setupLanguageListener } from '../lib/i18n';
import { Languages } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const [language, setCurrentLanguage] = useState(getCurrentLanguage());

  useEffect(() => {
    const cleanup = setupLanguageListener((newLang) => {
      setCurrentLanguage(newLang);
    });
    return cleanup;
  }, []);

  const handleToggle = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    setCurrentLanguage(newLang);
    // Reload page to apply translations
    window.location.reload();
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
      title={language === 'zh' ? 'Switch to English' : '切换为中文'}
    >
      <Languages size={16} />
      <span>{language === 'zh' ? 'EN' : '中'}</span>
    </button>
  );
};
