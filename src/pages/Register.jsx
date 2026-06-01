import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, VIEWS } from '../context/NavigationContext';
import { auth, createUserWithEmailAndPassword } from '../firebase';
import { sendEmailVerification, updateProfile } from 'firebase/auth';
import { Mail, Lock, User, ArrowLeft, Shield } from 'lucide-react';

const Register = () => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const { navigateTo, goBack } = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError(t('accept_terms'));
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 1. Crear el usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const currentUser = auth.currentUser || user;
      if (!currentUser) {
        throw new Error('No se encontró el usuario autenticado.');
      }

      // 2. Enviar el correo de verificación oficial de Firebase antes de actualizar el perfil.
      await sendEmailVerification(currentUser);

      // 3. Guardar el nombre de usuario directamente en el perfil oficial de Firebase Auth
      await updateProfile(currentUser, {
        displayName: username
      });

      setLoading(false);
      navigateTo(VIEWS.VERIFICATION);
      
    } catch (err) {
      setLoading(false);
      if (err.code === 'auth/email-already-in-use') {
        setError(t('email_in_use'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('weak_password'));
      } else if (err.code === 'auth/too-many-requests') {
        setError(t('too_many_requests'));
      } else {
        setError(err.message || t('error_occurred'));
      }
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
          {t('register')}
        </h2>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('register_subtitle')}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              type="text" 
              required
              placeholder={t('username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl outline-none border focus:ring-2 focus:ring-blue-500 transition-all ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

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

          <div className="flex flex-col gap-2 pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
              <input 
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded text-blue-500 focus:ring-blue-500 border-slate-300"
              />
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                {t('accept_terms')}
              </span>
            </label>
            <button 
              type="button"
              onClick={() => navigateTo(VIEWS.TERMS)}
              className="flex items-center gap-1.5 text-left text-xs font-bold text-blue-500 hover:underline pl-6"
            >
              <Shield size={12} />
              <span>{t('read_terms')}</span>
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 px-4 font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-2xl transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/10 active:scale-95 disabled:bg-blue-300 cursor-pointer"
          >
            {loading ? t('creating_account') : t('register')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;