import { useState, useEffect, useCallback, useMemo } from 'react';
import { Student } from '@/components/dashboard/StudentCard';
import { useAuth } from '@/context/AuthContext';
import { getStorageItem, setStorageItem, hasStorageItem } from '@/utils/storage';
import { compressData, decompressData } from '@/utils/compression';
import { toast } from 'sonner';
import { useRealtimeUpdates } from './useRealtimeUpdates';

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

// Pagination options
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// Search options
export interface SearchOptions {
  searchTerm: string;
  levelFilter: string;
  sortBy?: 'name' | 'age' | 'grade' | 'disabilityLevel';
  sortDirection?: 'asc' | 'desc';
}

// Cache for student data to avoid repeated storage access
let studentDataCache: { [userId: string]: StudentDetail[] } = {};
let teacherDataCache: { [userId: string]: Array<{id: string, name: string}> } = {};
let lastLoadTime: { [userId: string]: number } = {};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export function useStudentData() {
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [teachers, setTeachers] = useState<Array<{id: string, name: string}>>([]);
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { recordUpdate, checkForUpdates, lastUpdate, getSharedData } = useRealtimeUpdates();
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    pageSize: 9, // Default to 9 students per page (3x3 grid)
  });
  
  // Search state
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    searchTerm: '',
    levelFilter: 'all',
    sortBy: 'name',
    sortDirection: 'asc',
  });
  
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

  // Load students data with caching
  const loadStudents = useCallback(() => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get shared data first
      const sharedData = getSharedData();
      const storedStudents = sharedData.students || [];
      
      // Update cache
      studentDataCache[user.id] = storedStudents;
      lastLoadTime[user.id] = Date.now();
      
      setStudents(storedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, getSharedData]);

  // Load teachers data with caching
  const loadTeachers = useCallback(() => {
    if (!user) return;
    
    try {
      // Get shared data first
      const sharedData = getSharedData();
      const storedTeachers = sharedData.teachers || [];
      
      // Update cache
      teacherDataCache[user.id] = storedTeachers;
      lastLoadTime[user.id] = Date.now();
      
      setTeachers(storedTeachers);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeachers([]);
    }
  }, [user, getSharedData]);
  
  // Add new teacher
  const addTeacher = useCallback((name: string) => {
    if (!user) return null;
    
    const newTeacher = {
      id: `teacher_${Date.now()}`,
      name
    };
    
    const updatedTeachers = [...teachers, newTeacher];
    setTeachers(updatedTeachers);
    
    // Update cache
    teacherDataCache[user.id] = updatedTeachers;
    lastLoadTime[user.id] = Date.now();
    
    setStorageItem(TEACHERS_STORAGE_KEY, user.id, updatedTeachers);
    
    return newTeacher;
  }, [user, teachers]);
  
  // Delete teacher
  const deleteTeacher = useCallback((id: string) => {
    if (!user) return;
    
    const updatedTeachers = teachers.filter(teacher => teacher.id !== id);
    setTeachers(updatedTeachers);
    
    // Update cache
    teacherDataCache[user.id] = updatedTeachers;
    lastLoadTime[user.id] = Date.now();
    
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
      
      // Update cache
      studentDataCache[user.id] = updatedStudents;
      lastLoadTime[user.id] = Date.now();
      
      setStorageItem(STUDENTS_STORAGE_KEY, user.id, updatedStudents);
    }
    
    // Force refresh
    forceRefresh();
  }, [user, teachers, students, forceRefresh]);

  // Function to initialize mock data
  const initializeMockData = useCallback(() => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      setStorageItem(STUDENTS_STORAGE_KEY, user.id, MOCK_STUDENTS);
      
      // Update cache
      studentDataCache[user.id] = MOCK_STUDENTS;
      lastLoadTime[user.id] = Date.now();
      
      setStudents(MOCK_STUDENTS);
      toast.success('Mock data initialized');
    } catch (error) {
      console.error('Error initializing mock data:', error);
      toast.error('Failed to initialize mock data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Get a student by ID with caching
  const getStudentById = useCallback((id: string): StudentDetail | undefined => {
    return students.find(student => student.id === id);
  }, [students]);

  // Add a new student
  const addStudent = useCallback((studentData: Omit<StudentDetail, 'id'>) => {
    if (!user) return null;
    
    setIsLoading(true);
    
    try {
      const newStudent = {
        ...studentData,
        id: `student_${Date.now()}`,
      };
      
      const updatedStudents = [...students, newStudent];
      setStudents(updatedStudents);
      
      // Update cache
      studentDataCache[user.id] = updatedStudents;
      lastLoadTime[user.id] = Date.now();
      
      // Record the update with the full student data
      recordUpdate('student', 'create', newStudent);
      
      // Force refresh
      forceRefresh();
      
      return newStudent;
    } catch (error) {
      console.error('Error adding student:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, students, forceRefresh, recordUpdate]);

  // Update an existing student
  const updateStudent = useCallback((id: string, updatedData: Partial<StudentDetail>) => {
    if (!user) return null;
    
    setIsLoading(true);
    
    try {
      const studentIndex = students.findIndex(student => student.id === id);
      
      if (studentIndex === -1) {
        console.error('Student not found:', id);
        return null;
      }

      // Preserve existing data and merge with updates
      const updatedStudent = {
        ...students[studentIndex],
        ...updatedData,
        id // Ensure ID remains unchanged
      };

      // Update the students array
      const newStudents = [...students];
      newStudents[studentIndex] = updatedStudent;

      // Update cache
      studentDataCache[user.id] = newStudents;
      lastLoadTime[user.id] = Date.now();
      
      // Update state
      setStudents(newStudents);
      
      // Record the update with the full student data
      recordUpdate('student', 'update', updatedStudent);
      
      // Force a refresh
      forceRefresh();
      
      return updatedStudent;
    } catch (error) {
      console.error('Error updating student:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, students, forceRefresh, recordUpdate]);

  // Delete a student
  const deleteStudent = useCallback((id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!user) {
        reject(new Error('User not authenticated'));
        return;
      }
      
      setIsLoading(true);
      
      try {
        const studentToDelete = students.find(s => s.id === id);
        if (!studentToDelete) {
          reject(new Error('Student not found'));
          return;
        }

        const updatedStudents = students.filter(student => student.id !== id);
        
        // Update cache
        studentDataCache[user.id] = updatedStudents;
        lastLoadTime[user.id] = Date.now();
        
        // Update state
        setStudents(updatedStudents);
        
        // Record the update with the student data
        recordUpdate('student', 'delete', studentToDelete);
        
        // Force refresh
        forceRefresh();
        
        resolve();
      } catch (error) {
        console.error('Error deleting student:', error);
        reject(error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [user, students, forceRefresh, recordUpdate]);

  // Update pagination options
  const setPaginationOptions = useCallback((options: Partial<PaginationOptions>) => {
    setPagination(prev => ({ ...prev, ...options }));
  }, []);

  // Update search options
  const setSearchOptionsHandler = useCallback((options: Partial<SearchOptions>) => {
    setSearchOptions(prev => ({ ...prev, ...options }));
    // Reset to first page when search criteria change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Filter and sort students based on search options - memoized for performance
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Apply search term filter
      const searchTermLower = searchOptions.searchTerm.toLowerCase();
      const matchesSearch = 
        student.name.toLowerCase().includes(searchTermLower) ||
        student.disabilityType.toLowerCase().includes(searchTermLower) ||
        student.grade.toLowerCase().includes(searchTermLower);
      
      // Apply level filter
      const matchesLevel = searchOptions.levelFilter === 'all' ? true : student.disabilityLevel === searchOptions.levelFilter;
      
      return matchesSearch && matchesLevel;
    }).sort((a, b) => {
      // Apply sorting
      if (!searchOptions.sortBy) return 0;
      
      const sortBy = searchOptions.sortBy;
      const direction = searchOptions.sortDirection === 'desc' ? -1 : 1;
      
      if (sortBy === 'name') {
        return direction * a.name.localeCompare(b.name);
      } else if (sortBy === 'age') {
        return direction * (a.age - b.age);
      } else if (sortBy === 'grade') {
        return direction * a.grade.localeCompare(b.grade);
      } else if (sortBy === 'disabilityLevel') {
        const levelOrder = { 'Mild': 1, 'Moderate': 2, 'Severe': 3 };
        return direction * (levelOrder[a.disabilityLevel] - levelOrder[b.disabilityLevel]);
      }
      
      return 0;
    });
  }, [students, searchOptions]);

  // Get paginated students - memoized for performance
  const paginatedStudents = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, pagination]);

  // Calculate total pages - memoized for performance
  const totalPages = useMemo(() => {
    return Math.ceil(filteredStudents.length / pagination.pageSize);
  }, [filteredStudents, pagination.pageSize]);

  // Add periodic update check
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (checkForUpdates(lastUpdate)) {
        loadStudents();
        loadTeachers();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user, checkForUpdates, lastUpdate, loadStudents, loadTeachers]);

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
    initializeMockData,
    isLoading,
    // Pagination and search
    paginatedStudents,
    filteredStudents,
    pagination,
    searchOptions,
    totalPages,
    setPaginationOptions,
    setSearchOptions: setSearchOptionsHandler
  };
}
