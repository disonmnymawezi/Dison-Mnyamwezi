export interface Movie {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  trailerUrl?: string;
  videoUrl?: string;
  category: 'Trending' | 'Latest' | 'Popular' | 'Recommended';
  genre: string;
  rating: number; // Expert rating
  userRating?: number; // Average user rating (1-5)
  ratingCount?: number;
  year: number;
  createdAt: any;
  cachedAt?: string;
  expiresAt?: string;
}

export interface Rating {
  userId: string;
  movieId: string;
  rating: number;
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  favorites: string[];
  role: 'user' | 'admin';
  joinedAt?: any;
}
