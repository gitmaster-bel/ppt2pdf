import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';

export type Preferences = {
  preferredGenres: number[];
  adultContent: boolean;
  contentLanguage: string;
  originalLanguage: string[];
  showRatings: boolean;
  country: string;
  locationAutoDetected?: boolean;
  theme: 'red' | 'blue' | 'violet' | 'emerald' | 'mono' | 'rose' | 'amber' | 'cyan' | 'silicon';
  dataSaver?: boolean;
  serverLanguage?: string;
};

const defaultPreferences: Preferences = {
  preferredGenres: [],
  adultContent: false,
  contentLanguage: 'en-US',
  originalLanguage: [],
  showRatings: true,
  country: 'US',
  locationAutoDetected: false,
  theme: 'violet',
  serverLanguage: 'en',
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  useEffect(() => {
    const loadPrefs = () => {
      const data = storage.get();
      if (data.preferences) {
        // Migration: Purge banned Indian languages from legacy saves
        const banned = ['bn', 'mr', 'gu', 'pa'];
        if (data.preferences.originalLanguage && Array.isArray(data.preferences.originalLanguage)) {
          const originalLen = data.preferences.originalLanguage.length;
          data.preferences.originalLanguage = data.preferences.originalLanguage.filter((l: string) => !banned.includes(l));
          if (data.preferences.originalLanguage.length !== originalLen) {
            storage.set(data);
          }
        }

        setPreferences({ ...defaultPreferences, ...data.preferences });
        if (typeof document !== 'undefined' && !document.cookie.includes(`user_country=${data.preferences.country}`)) {
          document.cookie = `user_country=${data.preferences.country || 'US'}; max-age=31536000; path=/`;
        }
      }
    };
    
    loadPrefs();
    
    // Listen for cross-component preference updates
    window.addEventListener('preferences-changed', loadPrefs);
    return () => window.removeEventListener('preferences-changed', loadPrefs);
  }, []);

  const updatePreferences = (newPrefs: Partial<Preferences>) => {
    const prev = storage.get().preferences || defaultPreferences;
    const updated = { ...prev, ...newPrefs };
    const data = storage.get();
    data.preferences = updated;
    storage.set(data);
    setPreferences(updated);
    
    if (newPrefs.country && typeof document !== 'undefined') {
      document.cookie = `user_country=${newPrefs.country}; max-age=31536000; path=/`;
    }
    
    // Dispatch global event so other components using this hook update immediately
    setTimeout(() => {
      window.dispatchEvent(new Event('preferences-changed'));
    }, 0);
  };

  return { preferences, updatePreferences };
}
