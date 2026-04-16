/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Home from './pages/Home';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import MovieDetails from './pages/MovieDetails';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import GlobalErrorBoundary from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';

const AppContent = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-accent font-black text-3xl tracking-tighter italic"
        >
          DM MOVIES BOX
        </motion.div>
      </div>
    );
  }

  return (
    <GlobalErrorBoundary>
      <div className="min-h-screen bg-bg text-text-primary pb-20 selection:bg-accent selection:text-white">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/login" element={user ? <Navigate to="/profile" /> : <Login />} />
            
            {/* Protected Routes */}
            <Route path="/favorites" element={user ? <Favorites /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            
            {/* Admin Route */}
            <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
        <Navbar />
      </div>
    </GlobalErrorBoundary>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

