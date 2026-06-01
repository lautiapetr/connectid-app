import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../context/NavigationContext';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const Terms = () => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const { goBack } = useNavigation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
      <div className={`w-full max-w-2xl p-8 rounded-[2rem] transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.15)] border ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        <button 
          onClick={goBack}
          className={`flex items-center gap-2 mb-6 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <ShieldCheck size={26} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {t('terms_title')}
          </h2>
        </div>

        <div className="space-y-6 text-sm leading-relaxed max-h-[40vh] overflow-y-auto pr-2 mb-8">
          <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
            <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              {t('terms_paragraph_1')}
            </p>
          </div>
          <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
            <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              {t('terms_paragraph_2')}
            </p>
          </div>
        </div>

        <button
          onClick={goBack}
          className="w-full py-4 px-4 font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          {t('terms_close')}
        </button>

      </div>
    </div>
  );
};

export default Terms;