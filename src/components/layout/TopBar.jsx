import React, { useState, useEffect } from 'react';
import { Menu, Settings, User, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigation, VIEWS } from '../../context/NavigationContext';
import { auth, signOut, onAuthStateChanged } from '../../firebase';

const TopBar = () => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { navigateTo } = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigateTo(VIEWS.DASHBOARD);
  };

  return (
    <header className={`w-full h-16 flex flex-row items-center justify-between px-6 transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900 text-white border-b border-slate-800' : 'bg-white text-slate-800 border-b border-slate-200'
    } shadow-sm z-30 shrink-0`}>
      
      {/* Lado Izquierdo (Menu + Logo) */}
      <div className="flex items-center gap-4">
        <button className={`p-2 rounded-xl cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
           <Menu size={20} />
        </button>
        <h1 
          onClick={() => navigateTo(VIEWS.DASHBOARD)}
          className="text-xl font-black tracking-wider flex items-center gap-2 select-none cursor-pointer"
        >
           <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
           {t('app_name')}
        </h1>
      </div>

      {/* Lado Derecho (Auth + Ajustes) */}
      <div className="flex items-center gap-3">
        
        {/* Gestión de Perfil / Login */}
        {currentUser ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold hidden md:inline opacity-75">
              {currentUser.displayName || currentUser.email}
            </span>
            <button 
              onClick={handleLogout}
              className={`p-2.5 rounded-xl transition-all hover:text-red-500 ${
                isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
              title={t('logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => navigateTo(VIEWS.LOGIN)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-all shadow-md hover:shadow-blue-500/10 active:scale-95 cursor-pointer"
          >
            <User size={14} />
            <span>{t('login')}</span>
          </button>
        )}

        <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

        {/* Botón de Ajustes */}
        <button 
          onClick={() => navigateTo(VIEWS.SETTINGS)}
          className={`p-2 rounded-xl transition-all cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-500'}`}
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;