import React, { createContext, useState, useContext, useEffect } from 'react';
import english from '../languages/english.json';
import spanish from '../languages/spanish.json';

const translations = {
  english,
  spanish
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // En un entorno real, podrías guardar la preferencia en localStorage o en la config de Tauri
  const [currentLang, setCurrentLang] = useState('spanish');

  const t = (key, vars = {}) => {
    const rawText = translations[currentLang][key] || key;
    return rawText.replace(/\{(\w+)\}/g, (_, name) => {
      return vars[name] !== undefined ? vars[name] : `{${name}}`;
    });
  };

  const toggleLanguage = () => {
    setCurrentLang((prev) => (prev === 'english' ? 'spanish' : 'english'));
  };

  return (
    <LanguageContext.Provider value={{ currentLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage debe usarse dentro de LanguageProvider");
  return context;
};