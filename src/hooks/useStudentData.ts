import { useState, useEffect, useCallback } from 'react';
import { Student } from '@/components/dashboard/StudentCard';
import { useAuth } from '@/context/AuthContext';
import { getStorageItem, setStorageItem, hasStorageItem } from '@/utils/storage';
import { compressData, decompressData } from '@/utils/compression';
import { toast } from 'sonner';

// Mock data for initial load if no data in localStorage
const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'John Doe',
    age: 12,
    grade: '6th Grade',
    disabilityType: 'Autism Spectrum Disorder',
    disabilityLevel: 'Moderate',
  },
  {
    id: '2',
    name: 'Jane Smith',
    age: 10,
    grade: '4th Grade',
    disabilityType: 'Down Syndrome',
    disabilityLevel: 'Mild',
  },
  {
    id: '3',
    name: 'Michael Johnson',
    age: 14,
    grade: '8th Grade',
    disabilityType: 'ADHD',
    disabilityLevel: 'Mild',
  },
  {
    id: '4',
    name: 'Emily Williams',
    age: 11,
    grade: '5th Grade',
    disabilityType: 'Intellectual Disability',
    disabilityLevel: 'Severe',
  },
  {
    id: '5',
    name: 'David Brown',
    age: 13,
    grade: '7th Grade',
    disabilityType: 'Learning Disability',
    disabilityLevel: 'Moderate',
  },
  {
    id: '6',
    name: 'Sarah Davis',
    age: 9,
    grade: '3rd Grade',
    disabilityType: 'Cerebral Palsy',
    disabilityLevel: 'Moderate',
  }
];

// Extended student type
export interface StudentDetail extends Student {
  address?: string;
  disabilityPercentage?: number;
  medicalHistory?: string;
  referredHospital?: string;
  emergencyContact?: string;
  admissionDate?: string;
  gender?: 'Male' | 'Female' | 'Other';
  residenceType?: 'Permanent' | 'Temporary';
  previousSchool?: string;
  parentGuardianStatus?: 'Both Parents' | 'Single Parent' | 'Guardian' | 'Orphan';
  teacherAssigned?: string;
  otherNotes?: string;
  certificates?: Array<{
    id: string;
    name: string;
    type: string;
    date: string;
    data?: string; // Base64 encoded file data
  }>;
  hasDisabilityIdCard?: boolean;
  disabilityIdCard?: {
    id: string;
    name: string;
    type: string;
    date: string;
    data?: string; // Base64 encoded file data
  };
  // Sensitive info (admin only)
  wasAbused?: boolean;
  isSafeAtHome?: boolean;
  isFamilySupportive?: boolean;
  hasPTSD?: boolean;
  hasSelfHarmHistory?: boolean;
}

// Storage keys
const STUDENTS_STORAGE_KEY = 'students';
const TEACHERS_STORAGE_KEY = 'teachers';

export function useStudentData() {
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [teachers, setTeachers] = useState<Array<{id: string, name: string}>>([]);
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Force refresh function
  const forceRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Load students from localStorage on mount or when user changes
  useEffect(() => {
    if (!user) return;
    
    loadStudents();
    loadTeachers();
  }, [user?.id, refreshTrigger]);

  // Load teachers data
  const loadTeachers = useCallback(() => {
    if (!user) return;
    
    const storedTeachers = getStorageItem<Array<{id: string, name: string}>>(
      TEACHERS_STORAGE_KEY, 
      user.id, 
      []
    );
    setTeachers(storedTeachers);
  }, [user]);
  
  // Add new teacher
  const addTeacher = useCallback((name: string) => {
    if (!user) return null;
    
    const newTeacher = {
      id: `teacher_${Date.now()}`,
      name
    };
    
    const updatedTeachers = [...teachers, newTeacher];
    setTeachers(updatedTeachers);
    setStorageItem(TEACHERS_STORAGE_KEY, user.id, updatedTeachers);
    
    return newTeacher;
  }, [user, teachers]);
  
  // Delete teacher
  const deleteTeacher = useCallback((id: string) => {
    if (!user) return;
    
    const updatedTeachers = teachers.filter(teacher => teacher.id !== id);
    setTeachers(updatedTeachers);
    setStorageItem(TEACHERS_STORAGE_KEY, user.id, updatedTeachers);
    
    // Also remove this teacher from any assigned students
    const updatedStudents = students.map(student => {
      if (student.teacherAssigned === id) {
        return { ...student, teacherAssigned: undefined };
      }
      return student;
    });
    
    if (JSON.stringify(updatedStudents) !== JSON.stringify(students)) {
      setStudents(updatedStudents);
      setStorageItem(STUDENTS_STORAGE_KEY, user.id, updatedStudents);
    }
    
    // Force refresh
    forceRefresh();
  }, [user, teachers, students, forceRefresh]);

  // Function to explicitly load students from storage
  const loadStudents = useCallback(() => {
    if (!user) return;
    
    try {
      const storedStudents = getStorageItem<StudentDetail[]>(STUDENTS_STORAGE_KEY, user.id, []);
      setStudents(storedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    }
  }, [user]);

  // Function to initialize mock data
  const initializeMockData = useCallback(() => {
    if (!user) return;
    
    try {
      setStorageItem(STUDENTS_STORAGE_KEY, user.id, MOCK_STUDENTS);
      setStudents(MOCK_STUDENTS);
      toast.success('Mock data initialized');
    } catch (error) {
      console.error('Error initializing mock data:', error);
      toast.error('Failed to initialize mock data');
    }
  }, [user]);

  // Get a student by ID
  const getStudentById = useCallback((id: string): StudentDetail | undefined => {
    return students.find(student => student.id === id);
  }, [students]);

  // Add a new student - returns the newly created student
  const addStudent = useCallback((studentData: Omit<StudentDetail, 'id'>) => {
    if (!user) return null;
    
    try {
      const newStudent = {
        ...studentData,
        id: `student_${Date.now()}`, // Generate a unique ID
      };
      
      const updatedStudents = [...students, newStudent];
      setStudents(updatedStudents);
      setStorageItem(STUDENTS_STORAGE_KEY, user.id, updatedStudents);
      
      // Force refresh
      forceRefresh();
      
      return newStudent;
    } catch (error) {
      console.error('Error adding student:', error);
      return null;
    }
  }, [user, students, forceRefresh]);

  // Update an existing student
  const updateStudent = useCallback((id: string, updatedData: Partial<StudentDetail>) => {
    try {
      const currentStudents = getStorageItem<StudentDetail[]>(STUDENTS_STORAGE_KEY, user?.id || '', []);
      const studentIndex = currentStudents.findIndex(student => student.id === id);
      
      if (studentIndex === -1) {
        console.error('Student not found:', id);
        return null;
      }

      // Preserve existing data and merge with updates
      const updatedStudent = {
        ...currentStudents[studentIndex],
        ...updatedData,
        id // Ensure ID remains unchanged
      };

      // Update the students array
      const newStudents = [...currentStudents];
      newStudents[studentIndex] = updatedStudent;

      // Save to storage
      setStorageItem(STUDENTS_STORAGE_KEY, user?.id || '', newStudents);
      
      // Update state
      setStudents(newStudents);
      
      // Force a refresh
      forceRefresh();
      
      return updatedStudent;
    } catch (error) {
      console.error('Error updating student:', error);
      return null;
    }
  }, [user, forceRefresh]);

  // Delete a student
  const deleteStudent = useCallback((id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!user) {
        reject(new Error('User not authenticated'));
        return;
      }
      
      try {
        // Get current students from storage
        const currentStudents = getStorageItem<StudentDetail[]>(STUDENTS_STORAGE_KEY, user.id, []);
        const updatedStudents = currentStudents.filter(student => student.id !== id);
        
        // Update storage first
        setStorageItem(STUDENTS_STORAGE_KEY, user.id, updatedStudents);
        
        // Then update state
        setStudents(updatedStudents);
        
        // Force refresh
        forceRefresh();
        
        resolve();
      } catch (error) {
        console.error('Error deleting student:', error);
        reject(error);
      }
    });
  }, [user, forceRefresh]);

  return {
    students,
    teachers,
    loadStudents,
    loadTeachers,
    getStudentById,
    addStudent,
    updateStudent,
    deleteStudent,
    addTeacher,
    deleteTeacher,
    forceRefresh,
    initializeMockData
  };
}
