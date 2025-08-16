import { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/auth';
import { User } from '../types';

export const useCurrentUser = () => {
  const [user, setUser] = useState<User>(getCurrentUser());

  useEffect(() => {
    const handleUserUpdate = (event: CustomEvent) => {
      setUser(event.detail);
    };

    window.addEventListener('userUpdated', handleUserUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate as EventListener);
    };
  }, []);

  return user;
};