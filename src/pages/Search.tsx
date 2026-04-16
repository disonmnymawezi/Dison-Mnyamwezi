import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { Search as SearchIcon, Filter, ArrowUpDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Search = () => {
  const { t } = useLanguage();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState<'latest' | 'userRating' | 'expertRating'>('latest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'movies'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const moviesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Movie[];
      setMovies(moviesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'movies');
    });

    return () => unsubscribe();
  }, []);

  const genres = ['All', ...new Set(movies.map(m => m.genre))];

  const filteredMovies = movies
    .filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || movie.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return b.year - a.year;
      if (sortBy === 'userRating') return (b.userRating || 0) - (a.userRating || 0);
      if (sortBy === 'expertRating') return b.rating - a.rating;
      return 0;
    });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-8 bg-bg min-h-screen pb-24"
    >
      <div className="sticky top-0 bg-bg/95 backdrop-blur-sm pt-4 pb-6 z-10 space-y-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input
              type="text"
              placeholder={t('collectionSearch')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border-theme rounded py-4 pl-12 pr-12 text-[10px] font-black tracking-widest uppercase focus:outline-none focus:border-accent transition-all placeholder:text-text-secondary/50"
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-accent transition-colors p-1"
                >
                  <X size={16} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-surface border border-border-theme rounded pl-4 pr-10 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest focus:outline-none focus:border-accent appearance-none h-full cursor-pointer transition-all"
            >
              <option value="latest">{t('chronological')}</option>
              <option value="userRating">{t('communityChoice')}</option>
              <option value="expertRating">{t('curatorScore')}</option>
            </select>
            <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 text-accent pointer-events-none" size={14} />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-5 py-2.5 rounded text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border ${
                selectedGenre === genre 
                  ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                  : 'bg-surface text-text-secondary border-border-theme hover:border-text-secondary'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {filteredMovies.map(movie => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      {filteredMovies.length === 0 && !loading && (
        <div className="text-center py-32 space-y-4">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto border border-border-theme text-text-secondary opacity-20">
            <SearchIcon size={32} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary">{t('noResults')}</p>
        </div>
      )}
    </motion.div>
  );
};

export default Search;
