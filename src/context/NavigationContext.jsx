import React, { createContext, useState, useContext } from 'react';

// Definimos las vistas disponibles en nuestra App
export const VIEWS = {
  DASHBOARD: 'DASHBOARD',
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  VERIFICATION: 'VERIFICATION',
  TERMS: 'TERMS',
  SETTINGS: 'SETTINGS'
};

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  // Guardamos un historial simple para poder volver atrás ("Back")
  const [history, setHistory] = useState([VIEWS.DASHBOARD]);

  const navigateTo = (view) => {
    setHistory((prev) => [...prev, view]);
    setCurrentView(view);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Removemos la actual
      const previousView = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCurrentView(previousView);
    } else {
      setCurrentView(VIEWS.DASHBOARD);
    }
  };

  return (
    <NavigationContext.Provider value={{ currentView, navigateTo, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation debe usarse dentro de NavigationProvider");
  return context;
};