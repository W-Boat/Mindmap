import React from 'react';
import { useAuth } from '../lib/authContext';
import { Languages } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useAuth();

  const handleToggle = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
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
