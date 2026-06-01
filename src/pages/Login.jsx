import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, VIEWS } from '../context/NavigationContext';
import { auth, signInWithEmailAndPassword, signInWithRedirect, googleProvider } from '../firebase';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

const Login = () => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const { navigateTo, goBack } = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Validar que el email está verificado
      await userCredential.user.reload();
      
      if (!userCredential.user.emailVerified) {
        setError(t('verify_email_first'));
        navigateTo(VIEWS.VERIFICATION);
        return;
      }
      
      navigateTo(VIEWS.DASHBOARD);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError(t('user_not_found'));
      } else if (err.code === 'auth/wrong-password') {
        setError(t('wrong_password'));
      } else {
        setError(err.message || t('error_occurred'));
      }
    }
  };

  // Usamos redirección en lugar de popups para evitar bloqueos del sistema de Tauri / Webview
  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      setError(err.message || t('error_occurred'));
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
      <div className={`w-full max-w-md p-8 rounded-3xl transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.15)] border ${
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

        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          {t('login')}
        </h2>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('login_subtitle')}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              type="email" 
              required
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl outline-none border focus:ring-2 focus:ring-blue-500 transition-all ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              type="password" 
              required
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl outline-none border focus:ring-2 focus:ring-blue-500 transition-all ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 px-4 font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-2xl transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/10 active:scale-95"
          >
            {t('login')}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <span className={`absolute inset-x-0 top-1/2 h-px -translate-y-1/2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></span>
          <span className={`relative px-4 text-xs font-semibold ${isDarkMode ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>
            {t('or_continue_with')}
          </span>
        </div>

        {/* Botón Google Seguro con SVG nativo a color de Google */}
        <button 
          onClick={handleGoogleLogin}
          className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 font-bold border rounded-2xl transition-all active:scale-95 ${
            isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{t('google')}</span>
        </button>

        <div className="mt-6 text-center text-sm">
          <button 
            onClick={() => navigateTo(VIEWS.REGISTER)}
            className="text-blue-500 hover:underline font-semibold"
          >
            {t('signup_prompt')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;