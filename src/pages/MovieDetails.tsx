import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Movie, Rating } from '../types';
import { ChevronLeft, Play, Heart, Star, Calendar, Clock, Share2, Pause, Volume2, VolumeX, Volume1, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import YouTube, { YouTubeProps } from 'react-youtube';
import { saveMovieForOffline, getCachedMovie, removeCachedMovie } from '../lib/offline';
import { Download, CloudOff, CheckCircle2, Info } from 'lucide-react';

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingLoading, setRatingLoading] = useState(false);
  
  // Offline States
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isCached, setIsCached] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  // Custom Player States
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    const loadCachedStatus = async () => {
      if (id) {
        const cached = await getCachedMovie(id);
        setIsCached(!!cached);
      }
    };
    loadCachedStatus();

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const movieRef = doc(db, 'movies', id);
    
    // Initial Fetch with Offline Fallback
    const fetchMovieData = async () => {
      try {
        const docSnap = await getDoc(movieRef);
        if (docSnap.exists()) {
          setMovie({ id: docSnap.id, ...docSnap.data() } as Movie);
        } else {
          // Try Cache
          const cached = await getCachedMovie(id);
          if (cached) setMovie(cached);
        }
      } catch (err) {
        // Fallback to cache on network error
        const cached = await getCachedMovie(id);
        if (cached) setMovie(cached);
      } finally {
        setLoading(false);
      }
    };
    fetchMovieData();

    const unsubMovie = onSnapshot(movieRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Movie;
        setMovie(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `movies/${id}`);
    });

    let unsubRating = () => {};
    if (user && id) {
      const path = `movies/${id}/ratings/${user.uid}`;
      const ratingRef = doc(db, 'movies', id, 'ratings', user.uid);
      unsubRating = onSnapshot(ratingRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserRating(docSnap.data().rating);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
    }

    return () => {
      unsubMovie();
      unsubRating();
    };
  }, [id, user]);

  useEffect(() => {
    if (movie && isCached && !isCaching && !isOffline) {
      saveMovieForOffline(movie);
    }
  }, [movie, isCached, isCaching, isOffline]);

  const toggleOfflineCache = async () => {
    if (!movie || !id) return;
    setIsCaching(true);
    try {
      if (isCached) {
        await removeCachedMovie(id);
        setIsCached(false);
      } else {
        await saveMovieForOffline(movie);
        setIsCached(true);
      }
    } catch (err) {
      console.error("Cache error:", err);
    } finally {
      setIsCaching(false);
    }
  };

  const handleDownloadTrailer = async () => {
    if (!movie?.videoUrl && !movie?.trailerUrl) return;
    const url = movie.videoUrl || movie.trailerUrl;
    
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch(url!);
      if (!response.ok) throw new Error('Remote archive unreachable');
      
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream context unavailable');

      const chunks = [];
      while(true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (total) {
          setDownloadProgress(Math.round((loaded / total) * 100));
        } else {
          // Indeterminate progress simulation
          setDownloadProgress((prev) => (prev + 5) % 100);
        }
      }

      const blob = new Blob(chunks, { type: 'video/mp4' });
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${movie.title.replace(/\s+/g, '_')}_Trailer.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn("Advanced download failed (likely CORS), falling back to native download:", err);
      // Fallback
      const link = document.createElement('a');
      link.href = url || '';
      link.setAttribute('download', `${movie.title.replace(/\s+/g, '_')}_Trailer.mp4`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleRate = async (rate: number) => {
    if (!user || !id || !movie) {
      navigate('/login');
      return;
    }
    setRatingLoading(true);
    try {
      const ratingRef = doc(db, 'movies', id, 'ratings', user.uid);
      const movieRef = doc(db, 'movies', id);

      const prevRating = userRating;
      const currentAvg = movie.userRating || 0;
      const currentCount = movie.ratingCount || 0;

      let newCount = currentCount;
      let newAvg = currentAvg;

      if (prevRating === null) {
        newCount = currentCount + 1;
        newAvg = (currentAvg * currentCount + rate) / newCount;
      } else {
        newAvg = (currentAvg * currentCount - prevRating + rate) / currentCount;
      }

      const ratingPath = `movies/${id}/ratings/${user.uid}`;
      const moviePath = `movies/${id}`;
      
      try {
        await setDoc(ratingRef, {
          userId: user.uid,
          movieId: id,
          rating: rate,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, ratingPath);
      }

      try {
        await updateDoc(movieRef, {
          userRating: Number(newAvg.toFixed(1)),
          ratingCount: newCount,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, moviePath);
      }

      setUserRating(rate);
    } catch (error) {
      console.error('Error rating movie:', error);
    } finally {
      setRatingLoading(false);
    }
  };

  const isFavorite = profile?.favorites?.includes(id || '');

  const getCacheStatus = () => {
    if (isCaching) return { label: 'SYNCING' };
    if (isOffline) return { label: 'OFFLINE ARCHIVE' };
    if (isCached) {
      const expiresStr = movie?.expiresAt ? new Date(movie.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
      if (movie?.expiresAt) {
        const expires = new Date(movie.expiresAt);
        const nearExpiry = expires.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
        if (nearExpiry) return { label: 'EXPIRING SOON', date: expiresStr };
      }
      return { label: 'CACHED', date: expiresStr };
    }
    return null;
  };

  const status = getCacheStatus();

  const toggleFavorite = async () => {
    if (!user || !id) {
      navigate('/login');
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    const path = `users/${user.uid}`;
    try {
      if (isFavorite) {
        await updateDoc(userRef, { favorites: arrayRemove(id) });
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(id) });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // Player Handlers
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    setPlayer(event.target);
    event.target.setVolume(volume);
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    // 1 = playing, 2 = paused
    setIsPlaying(event.data === 1);
  };

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (player) {
      player.setVolume(val);
      if (val > 0) {
        player.unMute();
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  if (loading) return <div className="min-h-screen bg-black" />;
  if (!movie) return <div className="p-8 text-center bg-bg min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-text-secondary">{t('movieNotFound')}</div>;

  const youtubeId = movie.trailerUrl?.split('v=')[1]?.split('&')[0] || movie.trailerUrl?.split('/').pop();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-bg pb-20"
    >
      {/* Hero Section */}
      <div className="relative h-[65vh] w-full">
        <img
          src={movie.imageUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
        
        {/* Top Controls */}
        <div className="absolute top-8 left-6 right-6 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-surface/50 backdrop-blur-md rounded-full flex items-center justify-center border border-border-theme text-text-primary"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-3 items-center">
            {status && (
              <motion.span 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2",
                  status.label === 'EXPIRING SOON' ? "bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse" :
                  status.label === 'SYNCING' ? "bg-accent/10 border-accent/20 text-accent" :
                  "bg-green-500/10 border-green-500/20 text-green-500"
                )}
              >
                <span>{status.label}</span>
                {status.date && (
                  <span className="opacity-60 border-l border-current pl-2 font-bold">EXP: {status.date}</span>
                )}
              </motion.span>
            )}
            <button 
              onClick={toggleOfflineCache}
              disabled={isCaching}
              className={cn(
                "w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center border border-border-theme transition-all",
                isCached ? 'bg-accent/20 text-accent border-accent/30' : 'bg-surface/50 text-text-primary'
              )}
            >
              {isCaching ? <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" /> : 
               isCached ? <CheckCircle2 size={20} /> : <Download size={20} />}
            </button>
            <button className="w-12 h-12 bg-surface/50 backdrop-blur-md rounded-full flex items-center justify-center border border-border-theme text-text-primary">
              <Share2 size={20} />
            </button>
            <button
              onClick={toggleFavorite}
              className={`w-12 h-12 bg-surface/50 backdrop-blur-md rounded-full flex items-center justify-center border border-border-theme transition-colors ${
                isFavorite ? 'text-accent' : 'text-text-primary'
              }`}
            >
              <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.open(movie.videoUrl || movie.trailerUrl, '_blank')}
            className="w-16 h-16 bg-accent rounded-full flex items-center justify-center shadow-2xl shadow-accent/40"
          >
            <Play size={28} fill="white" className="ml-1" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 -mt-24 relative z-10 space-y-8">
        {isOffline && (
          <div className="bg-accent/10 border border-accent/20 p-4 rounded flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <CloudOff size={16} className="text-accent" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-accent italic">Offline Integrity Mode • Local Cache Active</span>
                {isCached && (
                  <p className="text-[8px] text-text-secondary uppercase tracking-tighter opacity-70">
                    Archive expires: {movie.expiresAt ? new Date(movie.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '7 Days'}
                  </p>
                )}
              </div>
            </div>
            {isCached && (
              <div className="flex gap-2 items-center">
                <button 
                  onClick={handleDownloadTrailer}
                  disabled={isDownloading}
                  className={cn(
                    "flex items-center gap-2 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded transition-all transition-all relative overflow-hidden",
                    isDownloading ? "bg-accent/20 text-accent border border-accent/30" : "text-text-primary border border-border-theme bg-surface/50 hover:bg-surface"
                  )}
                >
                  {isDownloading && (
                    <motion.div 
                      className="absolute inset-0 bg-accent/10 origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: downloadProgress / 100 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2">
                    {isDownloading ? (
                      <div className="w-2 h-2 border border-accent border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download size={10} />
                    )}
                    {isDownloading ? `BITSTREAMING ${downloadProgress}%` : 'Download Trailer'}
                  </div>
                </button>
                <button 
                  onClick={toggleOfflineCache}
                  className="text-[8px] font-black uppercase tracking-widest text-accent border border-accent/30 px-3 py-1 rounded hover:bg-accent hover:text-white transition-all"
                >
                  Flush Cache
                </button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-[0.2em]">
            <span>{movie.genre}</span>
            <span className="w-1.5 h-1.5 bg-surface-lighter rounded-full" />
            <span>{movie.category}</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter leading-[0.9] text-text-primary italic">{movie.title}</h1>
          <div className="flex items-center gap-4 text-text-secondary text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Star size={12} className="text-yellow-500 fill-yellow-500" />
              <span className="text-text-primary">{movie.rating}</span>
            </div>
            {movie.userRating && (
              <div className="flex items-center gap-1.5 border-l border-border-theme pl-4">
                <Star size={12} className="text-accent fill-accent" />
                <span className="text-text-primary">{movie.userRating}</span>
                <span className="text-[10px] text-text-secondary">({movie.ratingCount})</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>{movie.year}</span>
            </div>
          </div>
        </div>

        {/* Rating Section */}
        <div className="bg-surface border border-border-theme p-8 rounded-lg flex flex-col items-center gap-6 shadow-xl">
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary italic">Your Rating</h3>
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                disabled={ratingLoading}
                className="transition-transform active:scale-90 disabled:opacity-50"
              >
                <Star
                  size={36}
                  className={cn(
                    "transition-colors",
                    (userRating || 0) >= star
                      ? "text-accent fill-accent"
                      : "text-surface-lighter hover:text-text-secondary"
                  )}
                />
              </button>
            ))}
          </div>
          {userRating && (
            <p className="text-[10px] font-black text-accent uppercase tracking-widest animate-pulse italic">
              Level {userRating} Cinema Fan
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => window.open(movie.videoUrl, '_blank')}
            className="flex-1 bg-accent text-white font-black uppercase tracking-[0.15em] py-5 rounded text-xs flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg"
          >
            <Play size={16} fill="white" />
            {t('watchNow')}
          </button>
          <button
            onClick={() => window.open(movie.trailerUrl, '_blank')}
            className="flex-1 bg-surface-lighter text-text-primary font-black uppercase tracking-[0.15em] py-5 rounded text-xs flex items-center justify-center gap-2 border border-border-theme hover:bg-surface transition-colors"
          >
            {t('trailer')}
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-text-secondary italic">{t('synopsis')}</h3>
          <p className="text-text-secondary leading-relaxed text-sm font-medium">
            {movie.description}
          </p>
        </div>

        {/* Local Management */}
        {isCached && movie && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-surface/30 border border-border-theme p-6 rounded-xl space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20">
                  <Download className="text-accent" size={18} />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary italic">Local Archive Intelligence</h3>
                  <p className="text-[8px] text-text-secondary uppercase font-black tracking-widest opacity-60">Status: {isOffline ? 'Decentralized / Active' : 'Online / Latent'}</p>
                </div>
              </div>
              <button 
                onClick={toggleOfflineCache}
                className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-accent hover:text-white transition-all border border-accent/30 hover:bg-accent px-4 py-2 rounded"
              >
                <Trash2 size={12} />
                Wipe Local Store
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-bg/50 border border-border-theme p-3 rounded-lg flex items-center gap-3">
                <Calendar className="text-text-secondary" size={14} />
                <div className="space-y-0.5">
                  <p className="text-[7px] font-black text-text-secondary uppercase tracking-widest">Persistence Data</p>
                  <p className="text-[9px] font-black text-text-primary uppercase tracking-widest">
                    Exp: {movie.expiresAt ? new Date(movie.expiresAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="bg-bg/50 border border-border-theme p-3 rounded-lg flex items-center gap-3">
                <Clock className="text-text-secondary" size={14} />
                <div className="space-y-0.5">
                  <p className="text-[7px] font-black text-text-secondary uppercase tracking-widest">Archive Integrity</p>
                  <p className="text-[9px] font-black text-text-primary uppercase tracking-widest">Health: Operational</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Trailer Embed */}
        {youtubeId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary italic">Preview Reel</h3>
              {isOffline && (
                <div className="flex items-center gap-1 text-[8px] text-zinc-600 uppercase tracking-tighter">
                  <Info size={10} />
                  <span>Stream restricted offline</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="aspect-video rounded border border-border-theme bg-surface overflow-hidden relative group">
                {isOffline ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-8 text-center space-y-4">
                    <CloudOff size={32} className="text-zinc-800" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Connection Lost</p>
                      <p className="text-zinc-700 text-[9px] leading-tight max-w-[200px] mx-auto">
                        YouTube streaming requires an active link. Metadata and descriptions remain available via local manifest.
                      </p>
                    </div>
                  </div>
                ) : (
                  <YouTube
                    videoId={youtubeId}
                    className="w-full h-full"
                    iframeClassName="w-full h-full"
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                    opts={{
                      playerVars: {
                        autoplay: 0,
                        controls: 0,
                        modestbranding: 1,
                        rel: 0,
                      },
                    }}
                  />
                )}
              </div>
              
              {/* Custom Controls */}
              {!isOffline && (
                <div className="bg-surface border border-border-theme rounded p-4 flex items-center justify-between gap-6 shadow-xl">
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 flex items-center justify-center bg-accent text-white rounded-full hover:bg-red-700 transition-all shadow-lg active:scale-95"
                  >
                    {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
                  </button>

                  <div className="flex-1 flex items-center gap-4">
                    <button onClick={toggleMute} className="text-text-secondary hover:text-accent transition-colors">
                      {isMuted || volume === 0 ? <VolumeX size={18} /> : volume < 50 ? <Volume1 size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="flex-1 h-1 bg-surface-lighter rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                    <span className="text-[10px] font-black text-text-secondary w-8 tracking-tighter">
                      {isMuted ? 0 : volume}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MovieDetails;
