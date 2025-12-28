import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedPassword = api.getPassword();
      if (savedPassword) {
        // Verify the saved password is still valid
        const result = await api.authenticate(savedPassword);
        if (result.success && result.data?.valid) {
          setIsAuthenticated(true);
        } else {
          api.clearPassword();
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await api.authenticate(password);
      
      if (result.success && result.data?.valid) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      } else {
        setError(result.error || 'Invalid password');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError('Connection failed. Is the scanner running?');
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    api.clearPassword();
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
