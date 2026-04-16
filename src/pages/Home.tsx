import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { motion } from 'motion/react';

const Home = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const q = query(collection(db, 'movies'), orderBy('createdAt', 'desc'));
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

  const categories: Movie['category'][] = ['Trending', 'Latest', 'Popular', 'Recommended'];

  if (loading) return <div className="p-8 text-center text-zinc-500">{t('loadingMovies')}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 space-y-8"
    >
      <header className="py-8 px-4">
        <h1 className="text-2xl font-black tracking-tighter text-accent italic">DM MOVIES BOX</h1>
        <p className="text-text-secondary text-xs uppercase tracking-widest mt-1">{t('premiumExperience')}</p>
      </header>

      {categories.map((category) => {
        const categoryMovies = movies.filter(m => m.category === category);
        if (categoryMovies.length === 0) return null;

        const categoryKey = category.toLowerCase();

        return (
          <section key={category} className="space-y-4 px-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-text-primary">{t(categoryKey)}</h2>
              <button className="text-[10px] text-accent font-black uppercase tracking-[0.2em]">{t('viewAll')}</button>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-6 no-scrollbar">
              {categoryMovies.map((movie) => (
                <div key={movie.id} className="min-w-[150px] w-[150px]">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </motion.div>
  );
};

export default Home;
