import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Trash2 } from 'lucide-react';
import { clearAllMoviesCache } from '../lib/offline';

const Favorites = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [purged, setPurged] = useState(false);

  const handleClearCache = async () => {
    await clearAllMoviesCache();
    setShowClearConfirm(false);
    setPurged(true);
    setTimeout(() => setPurged(false), 3000);
  };

  useEffect(() => {
    if (!profile?.favorites || profile.favorites.length === 0) {
      setMovies([]);
      setLoading(false);
      return;
    }

    // Firestore 'in' query is limited to 10 items, but for simplicity we'll use it
    // In a real app, you might want to fetch individually or use a different structure
    const q = query(collection(db, 'movies'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const moviesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Movie))
        .filter(movie => profile.favorites.includes(movie.id));
      setMovies(moviesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'movies');
    });

    return () => unsubscribe();
  }, [profile?.favorites]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-8 bg-bg min-h-screen pb-24"
    >
      <header className="flex items-center justify-between py-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
            <Heart className="text-accent fill-accent" size={24} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black italic tracking-tighter text-text-primary uppercase">{t('gallery')}</h1>
            <p className="text-text-secondary text-[10px] uppercase font-black tracking-widest">{t('privateSelection')}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowClearConfirm(true)}
          className="p-3 text-text-secondary hover:text-accent transition-all border border-border-theme rounded hover:border-accent/30 bg-surface/30"
          title="Flush Offline Archive"
        >
          <Trash2 size={18} />
        </button>
      </header>

      <AnimatePresence>
        {purged && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-500/10 border border-green-500/20 p-4 rounded text-center"
          >
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Local Archives Purged Successfully</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
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
                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary italic">Flush Local Cache?</h3>
                <p className="text-[9px] text-text-secondary uppercase tracking-[0.2em]">This will remove all locally stored movie metadata and trailers.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 bg-surface-lighter text-[10px] font-black uppercase tracking-widest rounded border border-border-theme hover:bg-surface"
                >
                  ABORT
                </button>
                <button 
                  onClick={handleClearCache}
                  className="flex-1 py-3 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-700"
                >
                  PURGE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {movies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="text-center py-40 space-y-6">
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto border border-border-theme text-text-secondary opacity-30">
            <Heart size={32} />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-primary">{t('galleryEmpty')}</p>
            <p className="text-text-secondary text-[10px] uppercase tracking-widest">{t('startCurating')}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Favorites;
