import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Heart, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

const Navbar = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/search', icon: Search, label: t('search') },
    { to: '/favorites', icon: Heart, label: t('favorites') },
    { to: '/profile', icon: User, label: t('profile') },
  ];

  if (isAdmin) {
    navItems.push({ to: '/admin', icon: Shield, label: t('admin') });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-theme px-6 py-3 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
          >
            {({ isActive }) => (
              <div className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-accent" : "text-text-secondary hover:text-text-primary"
              )}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
