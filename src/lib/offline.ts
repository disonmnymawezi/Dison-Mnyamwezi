import { openDB, IDBPDatabase } from 'idb';
import { Movie } from '../types';

const DB_NAME = 'movies-box-offline';
const STORE_NAME = 'cached-movies';
const CACHE_EXPIRY_DAYS = 7; // Cache lasts for 7 days

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};

export const saveMovieForOffline = async (movie: Movie) => {
  const db = await getDB();
  const cachedAt = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(cachedAt.getDate() + CACHE_EXPIRY_DAYS);

  return db.put(STORE_NAME, {
    ...movie,
    cachedAt: cachedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  });
};

export const getCachedMovie = async (id: string): Promise<Movie | undefined> => {
  const db = await getDB();
  const data = await db.get(STORE_NAME, id);
  
  if (data && data.expiresAt) {
    if (new Date() > new Date(data.expiresAt)) {
      await removeCachedMovie(id);
      return undefined;
    }
  }
  
  return data;
};

export const removeCachedMovie = async (id: string) => {
  const db = await getDB();
  return db.delete(STORE_NAME, id);
};

export const getAllCachedMovies = async (): Promise<Movie[]> => {
  const db = await getDB();
  const movies = await db.getAll(STORE_NAME);
  
  // Return only non-expired ones
  const now = new Date();
  return movies.filter(m => !m.expiresAt || new Date(m.expiresAt) > now);
};

export const clearAllMoviesCache = async () => {
  const db = await getDB();
  return db.clear(STORE_NAME);
};
