import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
        zIndex: 10
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileTap={{ scale: 0.98 }}
      className="relative group aspect-[2/3] rounded-lg overflow-hidden bg-surface shadow-lg border border-border-theme transition-all"
    >
      <Link to={`/movie/${movie.id}`}>
        <img
          src={movie.imageUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <h3 className="text-xs font-bold truncate text-text-primary">{movie.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-text-secondary">{movie.year}</span>
            <div className="flex items-center gap-1">
              <Star size={8} className="text-yellow-500 fill-yellow-500" />
              <span className="text-[9px] font-bold text-text-primary">{movie.rating}</span>
            </div>
          </div>
        </div>
        {/* Rating Badge */}
        <div className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1 border border-border-theme">
          <Star size={8} className="text-yellow-500 fill-yellow-500" />
          <span className="text-[9px] font-bold text-text-primary">{movie.rating}</span>
        </div>
      </Link>
    </motion.div>
  );
};

export default MovieCard;
