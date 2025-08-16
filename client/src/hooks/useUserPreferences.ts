import { useState, useEffect } from 'react';
import { getUserPreferences, setUserPreferences } from '../utils/auth';

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(getUserPreferences());

  useEffect(() => {
    const handlePreferencesUpdate = (event: CustomEvent) => {
      setPreferences(event.detail);
    };

    window.addEventListener('preferencesUpdated', handlePreferencesUpdate as EventListener);
    
    return () => {
      window.removeEventListener('preferencesUpdated', handlePreferencesUpdate as EventListener);
    };
  }, []);

  const updatePreferences = (newPreferences: any) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setUserPreferences(updatedPreferences);
    setPreferences(updatedPreferences);
  };

  return {
    preferences,
    updatePreferences
  };
};