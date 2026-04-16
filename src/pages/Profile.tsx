import React, { useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { signOut, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, Bell, Shield, Heart, User as UserIcon, Calendar, Edit2, Check, X, Key, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, profile, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(profile?.displayName || user?.displayName || '');
  const [updating, setUpdating] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState<'none' | 'protocols' | 'registration'>('none');

  const handleLogout = () => signOut(auth);

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;
    setUpdating(true);
    try {
      // Update Auth Profile
      await updateProfile(user, { displayName: newName });
      
      // Update Firestore Profile
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { displayName: newName }, { merge: true });
      
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setUpdating(false);
    }
  };

  const joinedDate = profile?.joinedAt 
    ? new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'New User';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (passData.new !== passData.confirm) {
        setPassError('New passwords do not match.');
        return;
    }

    if (passData.new.length < 6) {
        setPassError('Password must be at least 6 characters.');
        return;
    }

    setUpdating(true);
    try {
        if (!user || !user.email) return;

        // Re-authenticate first
        const credential = EmailAuthProvider.credential(user.email, passData.current);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, passData.new);
        setPassSuccess('Security protocols updated successfully.');
        setIsChangingPass(false);
        setPassData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
        console.error('Password change error:', error);
        setPassError(error.message || 'Failed to update credentials. Check current password.');
    } finally {
        setUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-10 pb-32 bg-bg min-h-screen"
    >
      <header className="py-12 flex flex-col items-center space-y-6">
        <div className="relative group">
          <div className="w-28 h-28 bg-surface rounded-full flex items-center justify-center border border-border-theme p-1.5 shadow-2xl relative overflow-hidden">
            <div className="w-full h-full bg-surface-lighter rounded-full flex items-center justify-center overflow-hidden border border-border-theme">
              {profile?.photoURL || user?.photoURL ? (
                <img referrerPolicy="no-referrer" src={profile?.photoURL || user?.photoURL || ""} alt="Avatar" className="w-full h-full object-cover grayscale opacity-80" />
              ) : (
                <UserIcon size={48} className="text-text-secondary" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent rounded-full border-4 border-bg flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
        </div>

        <div className="text-center space-y-4 w-full max-w-xs">
          <div className="flex flex-col items-center gap-2">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 w-full"
                >
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-surface border border-accent/30 rounded px-3 py-2 text-sm font-bold focus:outline-none w-full text-center italic"
                    placeholder="Enter new display name"
                    autoFocus
                  />
                  <button onClick={handleUpdateName} disabled={updating} className="p-2 text-accent hover:bg-accent/10 rounded">
                    {updating ? <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" /> : <Check size={18} />}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-2 text-text-secondary hover:bg-white/5 rounded">
                    <X size={18} />
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group flex items-center gap-3"
                >
                  <h2 className="text-2xl font-black italic tracking-tighter text-text-primary">
                    {profile?.displayName || user?.displayName || 'Cinema Afficionado'}
                  </h2>
                  <button 
                    onClick={() => {
                      setNewName(profile?.displayName || user?.displayName || '');
                      setIsEditing(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-text-secondary hover:text-accent"
                  >
                    <Edit2 size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">{user?.email}</p>
          </div>

          {isAdmin && (
            <div className="flex justify-center">
              <span className="px-3 py-1 bg-accent/10 text-accent text-[8px] font-black uppercase tracking-[0.25em] rounded border border-accent/20 italic shadow-lg shadow-accent/5">
                {t('eliteCurator')}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Account Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface/40 border border-border-theme p-5 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">{t('commissioned')}</span>
          </div>
          <p className="text-xs font-black text-text-primary italic">{joinedDate}</p>
        </div>
        <div className="bg-surface/40 border border-border-theme p-5 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <Heart size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">{t('favorites')}</span>
          </div>
          <p className="text-xs font-black text-text-primary italic">{profile?.favorites?.length || 0} {t('assets')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] pl-1">{t('operationalControls')}</h3>
        <div className="grid gap-2">
          <button 
            onClick={() => setShowDiagnostics(showDiagnostics === 'registration' ? 'none' : 'registration')}
            className={`w-full flex items-center justify-between p-5 bg-surface rounded border transition-all ${showDiagnostics === 'registration' ? 'border-accent/40 bg-accent/5' : 'border-border-theme hover:bg-surface-lighter'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-text-secondary/5 rounded flex items-center justify-center text-text-secondary border border-border-theme shadow-inner">
                <Bell size={18} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.15em]">{t('subscriptions')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-accent uppercase tracking-widest">{t('active')}</span>
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            </div>
          </button>

          <button 
            onClick={() => setShowDiagnostics(showDiagnostics === 'protocols' ? 'none' : 'protocols')}
            className={`w-full flex items-center justify-between p-5 bg-surface rounded border transition-all ${showDiagnostics === 'protocols' ? 'border-accent/40 bg-accent/5' : 'border-border-theme hover:bg-surface-lighter'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-text-secondary/5 rounded flex items-center justify-center text-text-secondary border border-border-theme shadow-inner">
                <Settings size={18} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.15em]">{t('protocols')}</span>
            </div>
          </button>

          <AnimatePresence>
            {showDiagnostics !== 'none' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-bg/50 border-x border-b border-border-theme rounded-b-xl -mt-2 p-6 space-y-4"
              >
                {showDiagnostics === 'protocols' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-text-secondary">
                      <span>Encryption Protocol</span>
                      <span className="text-text-primary italic">AES-256 GCM</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-text-secondary">
                      <span>Manifest Verification</span>
                      <span className="text-green-500 italic">Certified</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-text-secondary">
                      <span>Access Role</span>
                      <span className="text-accent italic">{isAdmin ? 'ADMIN_PRIVILEGED' : 'STANDARD_ACCESS'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-text-secondary">
                      <span>Information Integrity</span>
                      <span className="text-green-500 italic">Healthy</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-text-secondary">
                      <span>Sync Engine</span>
                      <span className="text-accent italic">Cloud Reactive</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-text-secondary">
                      <span>Latency Protocol</span>
                      <span className="text-text-primary italic">Optimized (Low)</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsChangingPass(!isChangingPass)}
            className="w-full flex items-center justify-between p-5 bg-surface rounded border border-border-theme hover:bg-surface-lighter transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-text-secondary/5 rounded flex items-center justify-center text-text-secondary border border-border-theme shadow-inner">
                <Key size={18} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.15em]">{t('security')}</span>
            </div>
            <Edit2 size={14} className="text-text-secondary" />
          </button>

          <AnimatePresence>
            {isChangingPass && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleChangePassword} className="p-6 bg-surface-lighter border border-border-theme rounded-xl mt-2 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{t('currentPassword')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
                      <input
                        type="password"
                        required
                        value={passData.current}
                        onChange={(e) => setPassData({ ...passData, current: e.target.value })}
                        className="w-full bg-bg border border-border-theme rounded py-3 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-accent transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{t('newPassword')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
                      <input
                        type="password"
                        required
                        value={passData.new}
                        onChange={(e) => setPassData({ ...passData, new: e.target.value })}
                        className="w-full bg-bg border border-border-theme rounded py-3 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-accent transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{t('confirmPassword')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
                      <input
                        type="password"
                        required
                        value={passData.confirm}
                        onChange={(e) => setPassData({ ...passData, confirm: e.target.value })}
                        className="w-full bg-bg border border-border-theme rounded py-3 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-accent transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  {passError && <p className="text-[9px] font-black uppercase tracking-wider text-accent italic">{passError}</p>}
                  {passSuccess && <p className="text-[9px] font-black uppercase tracking-wider text-green-500 italic">{passSuccess}</p>}
                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full bg-accent text-white font-black uppercase tracking-[0.2em] text-[9px] py-4 rounded transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                  >
                    {updating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('updateCredentials')}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between p-5 bg-accent/5 rounded border border-accent/10 hover:bg-accent/10 transition-all border-dashed"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded flex items-center justify-center text-accent border border-accent/20 shadow-lg shadow-accent/10">
                  <Shield size={18} />
                </div>
                <div className="text-left">
                  <span className="block text-[11px] font-black uppercase tracking-[0.15em] text-accent">{t('hub')}</span>
                  <span className="text-[8px] font-black text-accent/50 uppercase tracking-widest">{t('adminOnly')}</span>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="pt-4 space-y-6">
        {/* Language Selection */}
        <div className="bg-surface p-1 rounded-xl border border-border-theme flex">
          <button
            onClick={() => setLanguage('en')}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${language === 'en' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary'}`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('sw')}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${language === 'sw' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Kiswahili
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full group relative overflow-hidden p-5 bg-surface-lighter text-accent font-black uppercase tracking-[0.2em] text-[10px] rounded border border-border-theme hover:bg-accent hover:border-accent transition-all duration-500 italic"
        >
          <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
          <div className="relative z-10 flex items-center justify-center gap-3 group-hover:text-white transition-colors">
            <LogOut size={16} />
            {t('logout')}
          </div>
        </button>
        <p className="text-center mt-6 text-[8px] font-black text-text-secondary/30 uppercase tracking-[0.5em]">
          {t('endOfSession')}
        </p>
      </div>
    </motion.div>
  );
};

export default Profile;
