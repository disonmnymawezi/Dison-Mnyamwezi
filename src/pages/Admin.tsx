import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { Movie } from '../types';
import { Plus, Edit2, Trash2, X, Save, Film, Image as ImageIcon, Star, Calendar, Tag, Play, Video, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Admin = () => {
  const { t } = useLanguage();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passError, setPassError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    description: '',
    trailerUrl: '',
    videoUrl: '',
    category: 'Trending',
    genre: '',
    rating: 0,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (!isUnlocked) return;
    const q = query(collection(db, 'movies'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMovies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'movies');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const ratingNum = Number(formData.rating);
    const yearNum = Number(formData.year);

    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
      setValidationError("Invalid Metric: Rating must be 0-10");
      return;
    }
    if (isNaN(yearNum) || yearNum < 1800 || yearNum > 2100) {
      setValidationError("Invalid Marker: Year out of bounds");
      return;
    }

    setIsSaving(true);
    try {
      if (editingMovie) {
        const path = `movies/${editingMovie.id}`;
        await updateDoc(doc(db, 'movies', editingMovie.id), {
          ...formData,
          rating: ratingNum,
          year: yearNum,
        });
      } else {
        await addDoc(collection(db, 'movies'), {
          ...formData,
          rating: ratingNum,
          year: yearNum,
          createdAt: serverTimestamp(),
          userRating: 0,
          ratingCount: 0,
        });
      }
      setIsModalOpen(false);
      setEditingMovie(null);
      setFormData({
        title: '',
        imageUrl: '',
        description: '',
        trailerUrl: '',
        videoUrl: '',
        category: 'Trending',
        genre: '',
        rating: 0,
        year: new Date().getFullYear(),
      });
    } catch (error) {
      console.error('Error saving movie:', error);
      handleFirestoreError(error, OperationType.WRITE, editingMovie ? `movies/${editingMovie.id}` : 'movies');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      imageUrl: movie.imageUrl,
      description: movie.description,
      trailerUrl: movie.trailerUrl || '',
      videoUrl: movie.videoUrl || '',
      category: movie.category,
      genre: movie.genre,
      rating: movie.rating,
      year: movie.year,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const path = `movies/${id}`;
    try {
      await deleteDoc(doc(db, 'movies', id));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'dm2026') {
      setIsUnlocked(true);
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20"
        >
          <Shield size={32} className="text-accent" />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-xl font-black italic tracking-tighter text-text-primary uppercase">{t('authenticationChallenge')}</h1>
          <p className="text-text-secondary text-[8px] uppercase tracking-[0.4em] font-black">{t('authorizedPersonnel')}</p>
        </div>
        <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4">
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="ACCESS PROTOCOL"
            className="w-full bg-surface border border-border-theme rounded py-4 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-center focus:outline-none focus:border-accent transition-all italic"
          />
          {passError && (
            <p className="text-accent text-[8px] font-black uppercase tracking-widest italic animate-bounce">Access Denied: Invalid Credentials</p>
          )}
          <button
            type="submit"
            className="w-full bg-accent text-white font-black uppercase tracking-[0.3em] text-[10px] py-4 rounded shadow-xl shadow-accent/20 hover:bg-opacity-90 transition-all italic"
          >
            {t('engageAuth')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-bg min-h-screen pb-24">
      <header className="flex items-center justify-between py-10 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black italic tracking-tighter text-text-primary">{t('coreManifest')}</h1>
          <p className="text-text-secondary text-[10px] uppercase font-black tracking-widest">{t('metadataHub')}</p>
        </div>
        <button
          onClick={() => {
            setEditingMovie(null);
            setIsModalOpen(true);
          }}
          className="bg-accent text-white py-3 px-6 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-accent/20 italic"
        >
          <Plus size={16} />
          {t('appendEntry')}
        </button>
      </header>

      <div className="grid gap-3 px-4">
        {movies.map((movie) => (
          <div key={movie.id} className="bg-surface border border-border-theme p-5 rounded flex items-center gap-6 group hover:bg-surface-lighter transition-all">
            <img src={movie.imageUrl} className="w-12 h-18 object-cover rounded shadow-2xl" alt={movie.title} referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black uppercase tracking-widest text-text-primary truncate">{movie.title}</h3>
              <p className="text-text-secondary text-[9px] uppercase tracking-[0.2em] mt-1 italic font-medium">{movie.genre} • {movie.year}</p>
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-0.5 bg-surface-lighter text-text-secondary text-[8px] font-black uppercase tracking-widest rounded border border-border-theme">
                  {movie.category}
                </span>
                {movie.userRating && (
                  <span className="px-2 py-0.5 bg-accent/10 text-accent text-[8px] font-black uppercase tracking-widest rounded border border-accent/20">
                    SENSORY: {movie.userRating} ({movie.ratingCount})
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleEdit(movie)} className="p-2 text-text-secondary hover:text-accent transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => setConfirmDeleteId(movie.id)} className="p-2 text-text-secondary hover:text-accent transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Confirmation Modal for Deletion */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative p-8 bg-surface border border-border-theme rounded-lg max-w-sm w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto border border-accent/20">
                <Trash2 className="text-accent" size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary italic">Purge Protocol Initiate?</h3>
                <p className="text-[9px] text-text-secondary uppercase tracking-[0.2em]">This action will permanently redact this entry from the manifest.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3 bg-surface-lighter text-[10px] font-black uppercase tracking-widest rounded border border-border-theme hover:bg-surface"
                >
                  ABORT
                </button>
                <button 
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 py-3 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-700"
                >
                  CONFIRM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-bg/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-xl bg-surface border border-border-theme rounded-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-border-theme flex items-center justify-between bg-surface-lighter/30">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] text-text-primary italic">{editingMovie ? t('reviseManifest') : t('appendRecord')}</h2>
                  <p className="text-[9px] text-text-secondary uppercase tracking-widest">Entry ID: {editingMovie?.id?.substring(0, 8) || 'New Auto-Gen'}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-accent transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar bg-surface/50">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic">{t('designation')}</label>
                  <div className="relative">
                    <Film className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={16} />
                    <input
                      required
                      type="text"
                      placeholder="Title of Entry"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-bg border border-border-theme rounded py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-text-primary focus:outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic">{t('genre')}</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={16} />
                      <input
                        required
                        type="text"
                        placeholder="Action, Drama, Thriller..."
                        value={formData.genre}
                        onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                        className="w-full bg-bg border border-border-theme rounded py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-text-primary focus:outline-none focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic">{t('priorityGroup')}</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full bg-bg border border-border-theme rounded py-4 px-4 text-[10px] font-black uppercase tracking-widest text-text-primary focus:outline-none focus:border-accent transition-all appearance-none"
                    >
                      <option value="Trending">{t('trending')}</option>
                      <option value="Latest">{t('latest')}</option>
                      <option value="Popular">{t('popular')}</option>
                      <option value="Recommended">{t('recommended')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic">{t('expertMetric')}</label>
                    <div className="relative">
                      <Star className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={16} />
                      <input
                        required
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                        className="w-full bg-bg border border-border-theme rounded py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-text-primary focus:outline-none focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic">{t('temporalMarker')}</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={16} />
                      <input
                        required
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        className="w-full bg-bg border border-border-theme rounded py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-text-primary focus:outline-none focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic">{t('visualReference')}</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={16} />
                    <input
                      required
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full bg-bg border border-border-theme rounded py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-text-primary focus:outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic">{t('previewLink')}</label>
                    <div className="relative">
                      <Play className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={16} />
                      <input
                        type="url"
                        value={formData.trailerUrl}
                        onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                        className="w-full bg-bg border border-border-theme rounded py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-text-primary focus:outline-none focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic">{t('accessLink')}</label>
                    <div className="relative">
                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={16} />
                      <input
                        type="url"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="w-full bg-bg border border-border-theme rounded py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-text-primary focus:outline-none focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic">{t('contentAbstract')}</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-bg border border-border-theme rounded py-4 px-4 text-[10px] font-black uppercase tracking-widest text-text-primary focus:outline-none focus:border-accent transition-all resize-none leading-relaxed"
                  />
                </div>

                {validationError && (
                  <p className="text-[9px] font-black text-accent uppercase tracking-widest text-center animate-pulse italic">
                    {validationError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-accent text-white font-black uppercase tracking-[0.3em] py-5 rounded text-xs flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-2xl shadow-accent/20 italic transform active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />
                      {editingMovie ? t('finalizeRevisions') : t('certifyEntry')}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
