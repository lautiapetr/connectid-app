import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, VIEWS } from '../context/NavigationContext';
import { auth, signOut } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { ArrowLeft, MailCheck, RefreshCw, Copy, CheckCircle } from 'lucide-react';

const Verification = () => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const { navigateTo } = useNavigation();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [copied, setCopied] = useState(false);

  // Verificamos de forma reactiva si el usuario ya verificó el correo al cargar la vista
  useEffect(() => {
    const checkVerification = async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          navigateTo(VIEWS.DASHBOARD);
        }
      }
    };
    checkVerification();
    
    // Polling cada 3 segundos para detectar si se verificó el email sin recargar manualmente
    const interval = setInterval(checkVerification, 3000);
    
    return () => clearInterval(interval);
  }, [navigateTo]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCheckVerification = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Forzamos a Firebase a recargar los datos del usuario desde el servidor
      await auth.currentUser.reload();
      
      if (auth.currentUser.emailVerified) {
        // Redirige al Dashboard si el enlace ya fue clickeado
        navigateTo(VIEWS.DASHBOARD);
      } else {
        setError(t('verification_not_verified'));
      }
    } catch (err) {
      setError(t('verification_status_error'));
    }
    setLoading(false);
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError('');

    if (!auth.currentUser) {
      setError(t('verification_no_user'));
      setResendLoading(false);
      return;
    }

    try {
      await auth.currentUser.reload();
      await sendEmailVerification(auth.currentUser);
      setResendCooldown(60);
      alert(t('verification_sent'));
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setError(t('resend_too_many_requests'));
        setResendCooldown(60);
      } else {
        setError(err.message || t('error_occurred'));
      }
    }
    setResendLoading(false);
  };

  const copyEmailToClipboard = async () => {
    if (auth.currentUser?.email) {
      try {
        await navigator.clipboard.writeText(auth.currentUser.email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Error al copiar:', err);
      }
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className={isDarkMode ? 'text-white' : 'text-black'}>{t('project_not_found')}</p>
        <button onClick={() => navigateTo(VIEWS.LOGIN)} className="text-blue-500 mt-2">{t('go_to_login')}</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
      <div className={`w-full max-w-md p-8 rounded-3xl transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.15)] border ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        <button 
          onClick={() => {
            auth.signOut();
            navigateTo(VIEWS.LOGIN);
          }}
          className={`flex items-center gap-2 mb-6 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <ArrowLeft size={16} />
          <span>{t('back')}</span>
        </button>

        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-full mb-2">
            <MailCheck size={32} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t('verification_page_title')}
          </h2>
        </div>

        <p className={`text-sm mb-6 text-center leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('verification_page_desc', { email: auth.currentUser.email })}
        </p>

        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">{t('verification_tip_spam')}</p>
          <button
            onClick={copyEmailToClipboard}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all w-full justify-center ${
              isDarkMode 
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300' 
                : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
            }`}
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? t('email_copied') : t('copy_email')}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleCheckVerification}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:bg-blue-300 cursor-pointer"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            {loading ? t('checking_verification') : t('already_clicked_link')}
          </button>

          <button 
            onClick={handleResendEmail}
            disabled={resendLoading || resendCooldown > 0}
            className={`w-full py-3.5 px-4 font-bold rounded-2xl transition-all cursor-pointer ${
              isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            } disabled:opacity-50`}
          >
            {resendLoading ? t('resend_sending') : resendCooldown > 0 ? t('resend_in_seconds', { seconds: resendCooldown }) : t('resend_verification_email')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Verification;