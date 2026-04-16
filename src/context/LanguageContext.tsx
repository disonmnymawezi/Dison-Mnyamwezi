import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'sw';

interface Translations {
  [key: string]: {
    en: string;
    sw: string;
  };
}

export const translations: Translations = {
  // Navbar
  home: { en: 'Home', sw: 'Nyumbani' },
  search: { en: 'Search', sw: 'Tafuta' },
  favorites: { en: 'Favorites', sw: 'Vipenzi' },
  profile: { en: 'Profile', sw: 'Wasifu' },
  admin: { en: 'Admin', sw: 'Wasimamizi' },
  
  // Home
  trending: { en: 'Trending', sw: 'Inayovuma' },
  latest: { en: 'Latest', sw: 'Mpya Kabisa' },
  popular: { en: 'Popular', sw: 'Maarufu' },
  recommended: { en: 'Recommended', sw: 'Inapendekezwa' },
  viewAll: { en: 'View All', sw: 'Tazama Zote' },
  premiumExperience: { en: 'Premium Cinema Experience', sw: 'Uzoefu wa Sinema wa Daraja la Juu' },
  loadingMovies: { en: 'Loading movies...', sw: 'Inapakia filamu...' },
  
  // Auth / Login
  signIn: { en: 'Sign In', sw: 'Ingia' },
  register: { en: 'Register', sw: 'Jisajili' },
  email: { en: 'Access Email', sw: 'Barua Pepe' },
  password: { en: 'Secure Password', sw: 'Nywila Salama' },
  forgotPassword: { en: 'Forgot Password?', sw: 'Umesahau Nywila?' },
  authorizeSession: { en: 'Authorize Session', sw: 'Thibitisha Kikao' },
  createCredentials: { en: 'Create Credentials', sw: 'Tengeneza Akaunti' },
  googleLink: { en: 'Seamless Google Link', sw: 'Kiungo cha Google' },
  fullName: { en: 'Full Name', sw: 'Jina Kamili' },
  paradigmShift: { en: 'Paradigm Shift', sw: 'Mabadiliko ya Mtazamo' },
  cinematicIntegrity: { en: 'Cinematic Integrity System', sw: 'Mfumo wa Uadilifu wa Sinema' },

  // Profile
  logout: { en: 'Detach From Interface', sw: 'Ondoka kwenye Mfumo' },
  hub: { en: 'Management Hub', sw: 'Kitovu cha Usimamizi' },
  security: { en: 'Security Credentials', sw: 'Siri za Usalama' },
  operationalControls: { en: 'Operational Controls', sw: 'Udhibiti wa Uendeshaji' },
  commissioned: { en: 'Commissioned', sw: 'Iliyoanza' },
  eliteCurator: { en: 'Elite Collection Curator', sw: 'Mratibu wa Mkusanyiko wa Wasomi' },
  protocols: { en: 'System Protocols', sw: 'Itifaki za Mfumo' },
  subscriptions: { en: 'Briefing Subscriptions', sw: 'Usajili wa Taarifa' },
  assets: { en: 'Assets', sw: 'Zilizopo' },
  active: { en: 'Active', sw: 'Inafanya Kazi' },
  adminOnly: { en: 'Admin Access Only', sw: 'Ufikiaji wa Admin Tu' },
  endOfSession: { en: 'End of Session Terminal', sw: 'Mwisho wa Kifaa cha Kikao' },
  updateCredentials: { en: 'Update Credentials', sw: 'Sasisha Siri' },
  currentPassword: { en: 'Current Password', sw: 'Nywila ya Sasa' },
  newPassword: { en: 'New Password', sw: 'Nywila Mpya' },
  confirmPassword: { en: 'Confirm New Password', sw: 'Thibitisha Nywila Mpya' },

  // Admin
  coreManifest: { en: 'CORE MANIFEST', sw: 'ORODHA KUU' },
  metadataHub: { en: 'Metadata Control Hub', sw: 'Kitovu cha Udhibiti wa Metadata' },
  appendEntry: { en: 'Append Entry', sw: 'Ongeza Maingizo' },
  reviseManifest: { en: 'REVISE MANIFEST', sw: 'HAKIKI ORODHA' },
  appendRecord: { en: 'APPEND RECORD', sw: 'ONGEZA KUMBUKUMBU' },
  finalizeRevisions: { en: 'Finalize Revisions', sw: 'Kamilisha Mapitio' },
  certifyEntry: { en: 'Certify Entry', sw: 'Thibitisha Ingizo' },
  designation: { en: 'Designation', sw: 'Jina/Cheo' },
  genre: { en: 'Genre', sw: 'Aina' },
  priorityGroup: { en: 'Priority Group', sw: 'Kundi la Kipaumbele' },
  expertMetric: { en: 'Expert Metric', sw: 'Kiwango cha Mtaalam' },
  temporalMarker: { en: 'Temporal Marker', sw: 'Alama ya Muda' },
  visualReference: { en: 'Visual Reference URL', sw: 'URL ya Picha' },
  previewLink: { en: 'Preview Link (YouTube)', sw: 'Kiungo cha Hakiki (YouTube)' },
  accessLink: { en: 'Access Link', sw: 'Kiungo cha Kufungua' },
  contentAbstract: { en: 'Content Abstract', sw: 'Muhtasari wa Maudhui' },
  authenticationChallenge: { en: 'AUTHENTICATION CHALLENGE', sw: 'CHANGAMOTO YA UTHIBITISHO' },
  authorizedPersonnel: { en: 'Authorized Personnel Only', sw: 'Wafanyakazi Walioidhinishwa tu' },
  engageAuth: { en: 'Engage Authorization', sw: 'Anza Uidhinishaji' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    if (!translations[key]) return key;
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
