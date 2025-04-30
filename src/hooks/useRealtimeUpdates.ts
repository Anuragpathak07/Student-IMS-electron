import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStorageItem, setStorageItem } from '@/utils/storage';

// Storage keys
const UPDATES_STORAGE_KEY = 'updates';
const SHARED_DATA_KEY = 'shared_data';

interface Update {
  id: string;
  type: 'student' | 'teacher';
  action: 'create' | 'update' | 'delete';
  timestamp: number;
  userId: string;
  data: any; // Store the actual data that was changed
}

export function useRealtimeUpdates() {
  const { user } = useAuth();
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [updates, setUpdates] = useState<Update[]>([]);

  // Load updates from storage
  useEffect(() => {
    if (!user) return;

    const storedUpdates = getStorageItem<Update[]>(UPDATES_STORAGE_KEY, 'shared', []);
    setUpdates(storedUpdates);
    setLastUpdate(Date.now());
  }, [user]);

  // Save updates to storage
  useEffect(() => {
    if (!user || updates.length === 0) return;

    setStorageItem(UPDATES_STORAGE_KEY, 'shared', updates);
  }, [updates, user]);

  // Record an update
  const recordUpdate = useCallback((type: 'student' | 'teacher', action: 'create' | 'update' | 'delete', data: any) => {
    if (!user) return;

    const newUpdate: Update = {
      id: `update_${Date.now()}`,
      type,
      action,
      timestamp: Date.now(),
      userId: user.id,
      data
    };

    setUpdates(prev => [...prev, newUpdate]);
    setLastUpdate(Date.now());

    // Update shared data immediately
    const sharedData = getStorageItem<any>(SHARED_DATA_KEY, 'shared', { students: [], teachers: [] });
    
    if (type === 'student') {
      if (action === 'create') {
        sharedData.students = [...sharedData.students, data];
      } else if (action === 'update') {
        sharedData.students = sharedData.students.map((s: any) => 
          s.id === data.id ? { ...s, ...data } : s
        );
      } else if (action === 'delete') {
        sharedData.students = sharedData.students.filter((s: any) => s.id !== data.id);
      }
    } else if (type === 'teacher') {
      if (action === 'create') {
        sharedData.teachers = [...sharedData.teachers, data];
      } else if (action === 'update') {
        sharedData.teachers = sharedData.teachers.map((t: any) => 
          t.id === data.id ? { ...t, ...data } : t
        );
      } else if (action === 'delete') {
        sharedData.teachers = sharedData.teachers.filter((t: any) => t.id !== data.id);
      }
    }

    setStorageItem(SHARED_DATA_KEY, 'shared', sharedData);
  }, [user]);

  // Check for new updates
  const checkForUpdates = useCallback((lastCheck: number) => {
    return updates.some(update => update.timestamp > lastCheck);
  }, [updates]);

  // Get shared data
  const getSharedData = useCallback(() => {
    return getStorageItem<any>(SHARED_DATA_KEY, 'shared', { students: [], teachers: [] });
  }, []);

  return {
    lastUpdate,
    updates,
    recordUpdate,
    checkForUpdates,
    getSharedData
  };
} 