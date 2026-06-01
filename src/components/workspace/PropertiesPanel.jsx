import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Type, PaintBucket, PenTool, Hash, Bold, Italic, Palette, Square } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = [
  'transparent',
  '#ffffff', '#f8fafc', '#f1f5f9', '#1e293b', '#0f172a', '#000000',
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e'
];

const PropertiesPanel = ({ selectedElements = [], selectedConnections = [], onUpdateElement, onUpdateConnection }) => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();

  if (selectedElements.length === 0 && selectedConnections.length === 0) return null;

  const selectedElement = selectedElements.length > 0 ? selectedElements[0] : null;
  const selectedConnection = selectedConnections.length > 0 ? selectedConnections[0] : null;
  const title = selectedElements.length > 1 ? t('properties_title_multiple', { count: selectedElements.length }) : selectedElement ? t('properties_title_shape') : t('properties_title_connection');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 50, filter: 'blur(4px)' }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`w-72 h-full flex flex-col border-l shadow-2xl z-20 overflow-y-auto shrink-0 ${
        isDarkMode ? 'bg-slate-900/95 border-slate-800 text-slate-100 backdrop-blur-md' : 'bg-white/95 border-slate-200 text-slate-800 backdrop-blur-md'
      }`}
    >
      
      <div className={`p-4 border-b flex items-center gap-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <Palette size={18} className="text-blue-500" />
        <h3 className="font-bold text-sm tracking-wide">{title}</h3>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {selectedElement && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2 opacity-70"><PaintBucket size={14} /><label className="text-xs font-bold uppercase tracking-wider">{t('fill_color')}</label></div>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button key={color} onClick={() => onUpdateElement({ styles: { ...selectedElement.styles, fill: color } })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 relative ${selectedElement.styles.fill === color ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent shadow-sm'}`}
                    style={{ backgroundColor: color === 'transparent' ? (isDarkMode ? '#334155' : '#cbd5e1') : color }} title={color === 'transparent' ? t('transparent') : color}>
                      {color === 'transparent' && <span className="absolute inset-0 flex items-center justify-center text-[10px] opacity-50">Ø</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 opacity-70"><PenTool size={14} /><label className="text-xs font-bold uppercase tracking-wider">{t('border')}</label></div>
                <span className="text-xs font-mono opacity-60">{selectedElement.styles.strokeWidth}px</span>
              </div>
              <input type="range" min="0" max="8" step="1" value={selectedElement.styles.strokeWidth} onChange={(e) => onUpdateElement({ styles: { ...selectedElement.styles, strokeWidth: parseInt(e.target.value) } })}
                className="w-full accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
              <div className="flex flex-wrap gap-2 mt-2">
                {COLORS.map(color => (
                  <button key={`stroke_${color}`} onClick={() => onUpdateElement({ styles: { ...selectedElement.styles, stroke: color } })}
                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-125 relative ${selectedElement.styles.stroke === color ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent shadow-sm'}`}
                    style={{ backgroundColor: color === 'transparent' ? (isDarkMode ? '#334155' : '#cbd5e1') : color }} title={color === 'transparent' ? t('transparent') : color}>
                      {color === 'transparent' && <span className="absolute inset-0 flex items-center justify-center text-[8px] opacity-50">Ø</span>}
                  </button>
                ))}
              </div>
            </div>

            {selectedElement.type === 'RECTANGLE' && (
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 opacity-70"><Square size={14} /><label className="text-xs font-bold uppercase tracking-wider">{t('corner_rounding')}</label></div>
                  <span className="text-xs font-mono opacity-60">{parseInt(selectedElement.borderRadius) || 0}px</span>
                </div>
                <input type="range" min="0" max="60" step="1" value={parseInt(selectedElement.borderRadius) || 0} onChange={(e) => onUpdateElement({ borderRadius: `${e.target.value}px` })}
                  className="w-full accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 opacity-70"><Type size={14} /><label className="text-xs font-bold uppercase tracking-wider">{t('text_typography')}</label></div>
              <div className="flex gap-2">
                <button onClick={() => onUpdateElement({ styles: { ...selectedElement.styles, isBold: !selectedElement.styles.isBold } })}
                  className={`flex-1 p-2 rounded-lg flex justify-center border transition-all ${selectedElement.styles.isBold ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'}`}><Bold size={16} /></button>
                <button onClick={() => onUpdateElement({ styles: { ...selectedElement.styles, isItalic: !selectedElement.styles.isItalic } })}
                  className={`flex-1 p-2 rounded-lg flex justify-center border transition-all ${selectedElement.styles.isItalic ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'}`}><Italic size={16} /></button>
                <div className={`flex items-center px-3 rounded-lg border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <input type="number" min="8" max="120" value={selectedElement.styles.fontSize} onChange={(e) => onUpdateElement({ styles: { ...selectedElement.styles, fontSize: parseInt(e.target.value) || 14 } })}
                    className="w-10 bg-transparent outline-none text-xs font-mono text-center" />
                  <span className="text-[10px] opacity-50 ml-1">px</span>
                </div>
              </div>
              <div>
                <select value={selectedElement.styles.fontFamily || 'Inter'} onChange={(e) => onUpdateElement({ styles: { ...selectedElement.styles, fontFamily: e.target.value } })}
                  className={`w-full p-2 mt-1 rounded-lg text-xs outline-none border cursor-pointer ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <option value="Inter">{t('font_inter')}</option>
                  <option value="Arial, sans-serif">{t('font_arial')}</option>
                  <option value="Georgia, serif">{t('font_georgia')}</option>
                  <option value="'Courier New', monospace">{t('font_courier')}</option>
                  <option value="'Comic Sans MS', cursive">{t('font_comic')}</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLORS.slice(1).map(color => (
                  <button key={`text_${color}`} onClick={() => onUpdateElement({ styles: { ...selectedElement.styles, textColor: color } })}
                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-125 ${selectedElement.styles.textColor === color ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent shadow-sm'}`}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 opacity-70 mb-2"><Hash size={14} /><label className="text-xs font-bold uppercase tracking-wider">{t('dimensions')}</label></div>
              <div className="flex gap-4">
                <div className="flex-1"><span className="text-[10px] opacity-60 block mb-1">{t('width_label')}</span><input type="number" value={Math.round(selectedElement.width)} onChange={(e) => onUpdateElement({ width: parseInt(e.target.value) || 60 })} disabled={selectedElements.length > 1} className={`w-full p-2 rounded-lg text-xs font-mono outline-none border ${isDarkMode ? 'bg-slate-800 border-slate-700 disabled:opacity-50' : 'bg-slate-50 border-slate-200 disabled:opacity-50'}`} /></div>
                <div className="flex-1"><span className="text-[10px] opacity-60 block mb-1">{t('height_label')}</span><input type="number" value={Math.round(selectedElement.height)} onChange={(e) => onUpdateElement({ height: parseInt(e.target.value) || 40 })} disabled={selectedElements.length > 1} className={`w-full p-2 rounded-lg text-xs font-mono outline-none border ${isDarkMode ? 'bg-slate-800 border-slate-700 disabled:opacity-50' : 'bg-slate-50 border-slate-200 disabled:opacity-50'}`} /></div>
              </div>
            </div>
          </>
        )}

        {selectedConnection && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2 opacity-70"><PenTool size={14} /><label className="text-xs font-bold uppercase tracking-wider">{t('line_width')}</label></div><span className="text-xs font-mono opacity-60">{selectedConnection.width || 2.5}px</span></div>
              <input type="range" min="1" max="10" step="0.5" value={selectedConnection.width || 2.5} onChange={(e) => onUpdateConnection({ width: parseFloat(e.target.value) })} className="w-full accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
               <div className="flex items-center gap-2 opacity-70 mb-2"><PaintBucket size={14} /><label className="text-xs font-bold uppercase tracking-wider">{t('line_color')}</label></div>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLORS.slice(1).map(color => (
                  <button key={`conn_${color}`} onClick={() => onUpdateConnection({ color: color })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${(selectedConnection.color || '#3b82f6') === color ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent shadow-sm'}`}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default PropertiesPanel;