
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStorageItem, setStorageItem } from '@/utils/storage';

export interface Teacher {
  id: string;
  name: string;
}

export function useTeacherData() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const { user } = useAuth();

  // Load teachers from localStorage on mount
  useEffect(() => {
    if (!user) return;
    
    const storedTeachers = getStorageItem<Teacher[]>('teachers', user.id, []);
    setTeachers(storedTeachers);
  }, [user]);

  // Save teachers to localStorage whenever they change
  useEffect(() => {
    if (!user || teachers.length === 0) return;
    
    setStorageItem('teachers', user.id, teachers);
  }, [teachers, user]);

  // Add a new teacher
  const addTeacher = (name: string): Teacher => {
    if (!user) throw new Error('User not authenticated');
    
    const newTeacher = {
      id: Date.now().toString(),
      name,
    };
    
    setTeachers(prev => {
      const updated = [...prev, newTeacher];
      setStorageItem('teachers', user.id, updated);
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
      setStorageItem('teachers', user.id, updated);
      return updated;
    });
  };

  // Delete a teacher
  const deleteTeacher = (id: string): void => {
    if (!user) return;
    
    setTeachers(prev => {
      const updated = prev.filter(teacher => teacher.id !== id);
      setStorageItem('teachers', user.id, updated);
      return updated;
    });
  };

  return {
    teachers,
    addTeacher,
    updateTeacher,
    deleteTeacher
  };
}
