import React, { useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Mail, Lock, User, ArrowRight, Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Google Authentication failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSent(false);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      console.error('Reset error:', err);
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden bg-bg">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=1000"
          className="w-full h-full object-cover opacity-20 grayscale contrast-125 scale-110"
          alt="Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/90 to-transparent" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 w-full max-w-sm space-y-12"
      >
        <div className="text-center space-y-6">
          <motion.div 
            whileHover={{ rotate: 135 }}
            className="w-16 h-16 bg-accent rounded-sm flex items-center justify-center mx-auto shadow-2xl shadow-accent/40 rotate-45 border border-white/20 transition-transform duration-500"
          >
            <Play size={32} fill="white" className="ml-1 -rotate-45" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-text-primary italic uppercase">
              DM MOVIES <span className="text-accent underline decoration-4 underline-offset-8">BOX</span>
            </h1>
            <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.4em]">{t('cinematicIntegrity')}</p>
          </div>
        </div>

        <div className="space-y-8 bg-surface/50 backdrop-blur-xl p-8 rounded-2xl border border-border-theme shadow-2xl">
          <div className="flex gap-4 border-b border-border-theme pb-4">
            <button 
              onClick={() => setIsLogin(true)}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 transition-all ${isLogin ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {t('signIn')}
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 transition-all ${!isLogin ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {t('register')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-1">{t('fullName')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-bg border border-border-theme rounded-xl py-4 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-1">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-bg border border-border-theme rounded-xl py-4 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-1">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg border border-border-theme rounded-xl py-4 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[9px] font-black uppercase tracking-widest text-text-secondary hover:text-accent transition-colors"
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
              )}
            </div>

            {resetSent && (
              <p className="text-[9px] font-black uppercase tracking-wider text-green-500 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                Reset link sent to your email.
              </p>
            )}

            {error && (
              <p className="text-[9px] font-black uppercase tracking-wider text-accent bg-accent/10 p-3 rounded-lg border border-accent/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white font-black uppercase tracking-[0.2em] text-[10px] py-5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-accent/30 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? t('authorizeSession') : t('createCredentials')}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-theme"></div>
            </div>
            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em]">
              <span className="bg-[#121212] px-4 text-text-secondary">{t('paradigmShift')}</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-surface-lighter text-text-primary font-black uppercase tracking-widest text-[9px] py-4 rounded-xl transition-all border border-border-theme hover:bg-surface flex items-center justify-center gap-3"
          >
            <Chrome size={14} className="text-accent" />
            {t('googleLink')}
          </button>
        </div>

        <p className="text-text-secondary text-[8px] uppercase tracking-[0.3em] text-center opacity-40">
          Decentralized Content Distribution • v4.2.0
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
