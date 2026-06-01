import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NavigationProvider, useNavigation, VIEWS } from './context/NavigationContext';
import { auth, onAuthStateChanged } from './firebase';

// Importación de componentes y páginas
import TopBar from './components/layout/TopBar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Verification from './pages/Verification';
import Terms from './pages/Terms';
import Settings from './pages/Settings';
import Workspace from './pages/Workspace'; // <-- Importamos el Canvas

const AppContent = () => {
  const { isDarkMode } = useTheme();
  const { currentView, navigateTo } = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Proyecto activo cargado en el Workspace
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user && !user.emailVerified && currentView === VIEWS.DASHBOARD && currentView !== VIEWS.VERIFICATION) {
        navigateTo(VIEWS.VERIFICATION);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigateTo, currentView]);

  if (loading) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center font-sans ${isDarkMode ? 'bg-slate-955 text-white' : 'bg-slate-50 text-slate-800'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider opacity-75 animate-pulse">Connectid...</span>
        </div>
      </div>
    );
  }

  // Renderizado condicional de las vistas completas
  const renderView = () => {
    switch (currentView) {
      case VIEWS.DASHBOARD:
        return (
          <Dashboard 
            currentUser={currentUser} 
            onOpenProject={(project) => {
              setActiveProject(project);
              // Usamos un estado manual para no interferir con las páginas del enrutador de autenticación
              navigateTo('WORKSPACE');
            }}
          />
        );
      case 'WORKSPACE':
        return activeProject ? (
          <Workspace 
            project={activeProject} 
            onBackToDashboard={() => {
              setActiveProject(null);
              navigateTo(VIEWS.DASHBOARD);
            }} 
          />
        ) : null;
      case VIEWS.LOGIN:
        return <Login />;
      case VIEWS.REGISTER:
        return <Register />;
      case VIEWS.VERIFICATION:
        return <Verification />;
      case VIEWS.TERMS:
        return <Terms />;
      case VIEWS.SETTINGS:
        return <Settings />;
      default:
        return <Dashboard currentUser={currentUser} />;
    }
  };

  return (
    <div className={`w-full h-full flex flex-col font-sans transition-colors duration-500 overflow-hidden ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Ocultamos la barra superior si el usuario está activamente en el área del Workspace */}
      {currentView !== 'WORKSPACE' && <TopBar />}
      <div className="flex-1 w-full h-full flex flex-col overflow-y-auto relative z-10">
        {renderView()}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NavigationProvider>
          <AppContent />
        </NavigationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}