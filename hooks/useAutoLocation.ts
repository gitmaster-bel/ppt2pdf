'use client';
import { useEffect } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import { storage } from '@/lib/storage';

const COUNTRY_TO_LANG: Record<string, string[]> = {
  IN: ['hi', 'ta', 'te', 'ml', 'kn'], // India -> Major languages (Punjabi, Bengali, Marathi, Gujarati removed)
  FR: ['fr'], // France -> French
  ES: ['es'], // Spain -> Spanish
  DE: ['de'], // Germany -> German
  JP: ['ja'], // Japan -> Japanese
  KR: ['ko'], // Korea -> Korean
  CN: ['zh'], // China -> Chinese
  AE: ['ar'], // UAE -> Arabic
  IT: ['it'], // Italy -> Italian
  RU: ['ru'], // Russia -> Russian
  BR: ['pt'], // Brazil -> Portuguese
  PT: ['pt'], // Portugal -> Portuguese
  MX: ['es'], // Mexico -> Spanish
  AR: ['es'], // Argentina -> Spanish
  CO: ['es'], // Colombia -> Spanish
  SA: ['ar'], // Saudi Arabia -> Arabic
  EG: ['ar'], // Egypt -> Arabic
  ID: ['id'], // Indonesia -> Indonesian
  TH: ['th'], // Thailand -> Thai
  VN: ['vi'], // Vietnam -> Vietnamese
  TR: ['tr'], // Turkey -> Turkish
  NL: ['nl'], // Netherlands -> Dutch
  PL: ['pl'], // Poland -> Polish
};

export function useAutoLocation() {
  const { updatePreferences } = usePreferences();

  useEffect(() => {
    // Check actual local storage to avoid race conditions with hydration
    const savedPrefs = storage.get()?.preferences;
    if (typeof window === 'undefined' || savedPrefs?.locationAutoDetected) {
      return;
    }

    const detectLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('Failed to fetch location');
        const data = await res.json();
        
        // Double check in case it was updated while fetching
        if (storage.get()?.preferences?.locationAutoDetected) return;

        const country = data.country_code || 'US';
        const region = data.region_code || ''; // e.g. "MH", "TN", "DL"
        let nativeLangs = COUNTRY_TO_LANG[country] ? [...COUNTRY_TO_LANG[country]] : [];
        
        // Netflix-tier hyper-localized state engine for India
        if (country === 'IN') {
          // South Indian ISO 3166-2 Codes: Tamil Nadu, Andhra Pradesh, Telangana, Karnataka, Kerala, Puducherry
          const southIndianStates = ['TN', 'AP', 'TG', 'TS', 'KA', 'KL', 'PY'];
          
          if (southIndianStates.includes(region)) {
             // For South India, aggressively prioritize South Indian languages over Hindi
             nativeLangs = ['ta', 'te', 'ml', 'kn', 'hi']; 
          } else {
             // For North/Rest of India, aggressively prioritize Hindi
             nativeLangs = ['hi', 'te', 'ta', 'kn', 'ml'];
          }
        }
        
        const originalLanguage = ['en'];
        nativeLangs.forEach(lang => {
          if (lang !== 'en' && !originalLanguage.includes(lang)) {
            originalLanguage.push(lang);
          }
        });

        updatePreferences({
          originalLanguage,
          locationAutoDetected: true,
        });
      } catch (err) {
        console.error('Failed to auto-detect location:', err);
        updatePreferences({ locationAutoDetected: true });
      }
    };

    detectLocation();
  }, [updatePreferences]);
}
