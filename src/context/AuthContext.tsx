import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/utils/storage';

// Define the User type
type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher';
} | null;

// Define the context type
type AuthContextType = {
  user: User;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'current_user';
const USERS_COLLECTION_KEY = 'users';
const SYSTEM_USER_ID = 'system';

// Demo accounts
const DEMO_ACCOUNTS = {
  admin: {
    email: 'admin@nandanvanschool.com',
    password: 'admin@123',
    id: 'admin_1',
    name: 'Admin User',
    role: 'admin' as const
  },
  teacher: {
    email: 'teacher@school.com',
    password: 'password',
    id: 'teacher_1',
    name: 'Teacher User',
    role: 'teacher' as const
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize the initial user check
  const checkInitialUser = useCallback(() => {
    try {
      const storedUser = getStorageItem<User>(USER_STORAGE_KEY, SYSTEM_USER_ID, null);
      if (storedUser) {
        setUser(storedUser);
        if (location.pathname === '/login') {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location.pathname]);

  // Check if user is already logged in on initial load
  useEffect(() => {
    checkInitialUser();
  }, [checkInitialUser]);

  // Memoize the redirect effect
  const redirectIfNotLoggedIn = useCallback(() => {
    if (!isLoading && !user && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [user, isLoading, navigate, location.pathname]);

  useEffect(() => {
    redirectIfNotLoggedIn();
  }, [redirectIfNotLoggedIn]);

  // Memoize the signup function
  const signup = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email already exists
      const users = getStorageItem<Array<any>>(USERS_COLLECTION_KEY, SYSTEM_USER_ID, []);
      
      if (users.some((u) => u.email === email)) {
        setError('Email already exists');
        return;
      }
      
      // Create new user
      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        password,
        role: 'teacher' as const
      };
      
      // Save to users collection
      const updatedUsers = [...users, newUser];
      setStorageItem(USERS_COLLECTION_KEY, SYSTEM_USER_ID, updatedUsers);
      
      // Log in the new user
      const loggedInUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      };
      
      setUser(loggedInUser);
      setStorageItem(USER_STORAGE_KEY, SYSTEM_USER_ID, loggedInUser);
      
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Memoize the login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check demo accounts first
      if (email === DEMO_ACCOUNTS.admin.email && password === DEMO_ACCOUNTS.admin.password) {
        const { id, name, role } = DEMO_ACCOUNTS.admin;
        const loggedInUser = { id, name, email, role };
        setUser(loggedInUser);
        setStorageItem(USER_STORAGE_KEY, SYSTEM_USER_ID, loggedInUser);
        navigate('/dashboard');
        return;
      }
      
      if (email === DEMO_ACCOUNTS.teacher.email && password === DEMO_ACCOUNTS.teacher.password) {
        const { id, name, role } = DEMO_ACCOUNTS.teacher;
        const loggedInUser = { id, name, email, role };
        setUser(loggedInUser);
        setStorageItem(USER_STORAGE_KEY, SYSTEM_USER_ID, loggedInUser);
        navigate('/dashboard');
        return;
      }
      
      // Check registered users
      const users = getStorageItem<Array<any>>(USERS_COLLECTION_KEY, SYSTEM_USER_ID, []);
      const foundUser = users.find((u) => u.email === email && u.password === password);
      
      if (foundUser) {
        const loggedInUser = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role
        };
        setUser(loggedInUser);
        setStorageItem(USER_STORAGE_KEY, SYSTEM_USER_ID, loggedInUser);
        navigate('/dashboard');
        return;
      }
      
      setError('Invalid email or password');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Memoize the logout function
  const logout = useCallback(() => {
    setUser(null);
    removeStorageItem(USER_STORAGE_KEY, SYSTEM_USER_ID);
    toast.success('Logged out successfully');
    navigate('/login');
  }, [navigate]);

  // Memoize the context value
  const value = useMemo(() => ({
    user,
    login,
    signup,
    logout,
    isLoading,
    error
  }), [user, login, signup, logout, isLoading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
