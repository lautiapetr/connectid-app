import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../context/NavigationContext';
import { ArrowLeft, Settings as SettingsIcon, Globe, Sun, Moon } from 'lucide-react';

const Settings = () => {
  const { t, currentLang, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const { goBack } = useNavigation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
      <div className={`w-full max-w-xl p-8 rounded-[2rem] transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.15)] border ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        <button 
          onClick={goBack}
          className={`flex items-center gap-2 mb-6 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <ArrowLeft size={16} />
          <span>{t('back')}</span>
        </button>

        <div className="flex items-center gap-3.5 mb-8">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <SettingsIcon size={26} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {t('topbar_settings')}
          </h2>
        </div>

        <div className="space-y-4">
          
          {/* Fila Idioma */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${
            isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center gap-3">
              <Globe className="text-blue-500" size={20} />
              <div>
                <h4 className="font-bold text-sm">{t('language_title')}</h4>
                <p className="text-xs text-slate-400">{t('language_desc')}</p>
              </div>
            </div>
            <button 
              onClick={toggleLanguage}
              className="px-4 py-2 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all"
            >
              {currentLang === 'english' ? t('lang_spanish') : t('lang_english')}
            </button>
          </div>

          {/* Fila Tema */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${
            isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="text-yellow-400" size={20} /> : <Sun className="text-orange-400" size={20} />}
              <div>
                <h4 className="font-bold text-sm">{t('appearance_title')}</h4>
                <p className="text-xs text-slate-400">{t('appearance_desc')}</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                isDarkMode ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {isDarkMode ? t('theme_light') : t('theme_dark')}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Settings;