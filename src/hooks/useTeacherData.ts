import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStorageItem, setStorageItem } from '@/utils/storage';
import { useRealtimeUpdates } from './useRealtimeUpdates';

export interface Teacher {
  id: string;
  name: string;
}

export function useTeacherData() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const { user } = useAuth();
  const { recordUpdate, checkForUpdates, lastUpdate, getSharedData } = useRealtimeUpdates();

  // Load teachers from shared storage on mount
  useEffect(() => {
    if (!user) return;
    
    const sharedData = getSharedData();
    const storedTeachers = sharedData.teachers || [];
    setTeachers(storedTeachers);
  }, [user, getSharedData]);

  // Add a new teacher
  const addTeacher = (name: string): Teacher => {
    if (!user) throw new Error('User not authenticated');
    
    const newTeacher = {
      id: Date.now().toString(),
      name,
    };
    
    setTeachers(prev => {
      const updated = [...prev, newTeacher];
      recordUpdate('teacher', 'create', newTeacher);
      return updated;
    });
    
    return newTeacher;
  };

  // Update a teacher
  const updateTeacher = (id: string, name: string): void => {
    if (!user) return;
    
    setTeachers(prev => {
      const updated = prev.map(teacher => 
        teacher.id === id ? { ...teacher, name } : teacher
      );
      const updatedTeacher = updated.find(t => t.id === id);
      if (updatedTeacher) {
        recordUpdate('teacher', 'update', updatedTeacher);
      }
      return updated;
    });
  };

  // Delete a teacher
  const deleteTeacher = (id: string): void => {
    if (!user) return;
    
    setTeachers(prev => {
      const teacherToDelete = prev.find(t => t.id === id);
      if (teacherToDelete) {
        recordUpdate('teacher', 'delete', teacherToDelete);
      }
      return prev.filter(teacher => teacher.id !== id);
    });
  };

  // Add periodic update check
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (checkForUpdates(lastUpdate)) {
        const sharedData = getSharedData();
        const storedTeachers = sharedData.teachers || [];
        setTeachers(storedTeachers);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user, checkForUpdates, lastUpdate, getSharedData]);

  return {
    teachers,
    addTeacher,
    updateTeacher,
    deleteTeacher
  };
}
