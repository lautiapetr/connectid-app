import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';

const NotesPanel = ({ notes, onUpdateNotes, onClose }) => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 50, filter: 'blur(4px)' }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`w-80 h-full flex flex-col border-l shadow-2xl z-20 shrink-0 ${
        isDarkMode ? 'bg-slate-900/95 border-slate-800 text-slate-100 backdrop-blur-md' : 'bg-white/95 border-slate-200 text-slate-800 backdrop-blur-md'
      }`}
    >
      <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3">
          <FileText size={18} className="text-blue-500" />
          <h3 className="font-bold text-sm tracking-wide">{t('project_notes')}</h3>
        </div>
        <button 
          onClick={onClose} 
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <p className={`text-[10px] mb-3 opacity-60 uppercase font-bold tracking-wider`}>{t('notes_documentation')}</p>
        <textarea
          value={notes || ''}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder={t('notes_placeholder')}
          className={`flex-1 w-full p-4 rounded-xl resize-none outline-none border transition-all text-sm leading-relaxed ${
            isDarkMode 
              ? 'bg-slate-800/50 border-slate-700 text-slate-200 focus:border-blue-500' 
              : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500'
          }`}
        />
      </div>
    </motion.div>
  );
};

export default NotesPanel;