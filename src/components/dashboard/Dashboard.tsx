import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStudentData } from '@/hooks/useStudentData';
import { useAuth } from '@/context/AuthContext';
import TeacherManagement from './TeacherManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the StudentCard component
const StudentCard = lazy(() => import('./StudentCard'));

// Loading skeleton for student cards
const StudentCardSkeleton = () => (
  <div className="bg-card rounded-lg shadow-sm p-4 border">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

// Loading skeleton for student grid
const StudentGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array(6).fill(0).map((_, i) => (
      <StudentCardSkeleton key={i} />
    ))}
  </div>
);

const Dashboard: React.FC = () => {
  const { 
    paginatedStudents, 
    filteredStudents, 
    pagination, 
    searchOptions, 
    totalPages,
    setPaginationOptions,
    setSearchOptions,
    loadStudents,
    isLoading
  } = useStudentData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('students');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchOptions.searchTerm);
  
  // Ensure students are loaded when the dashboard mounts
  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user?.id]);
  
  // Debounce search term to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchOptions({ searchTerm: debouncedSearchTerm });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [debouncedSearchTerm]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPaginationOptions({ page: newPage });
  };
  
  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPaginationOptions({ pageSize: newSize, page: 1 });
  };
  
  // Handle sort change
  const handleSortChange = (sortBy: 'name' | 'age' | 'grade' | 'disabilityLevel') => {
    const newDirection = 
      searchOptions.sortBy === sortBy && searchOptions.sortDirection === 'asc' 
        ? 'desc' 
        : 'asc';
    
    setSearchOptions({ 
      sortBy, 
      sortDirection: newDirection 
    });
  };
  
  // Get sort icon based on current sort
  const getSortIcon = (field: 'name' | 'age' | 'grade' | 'disabilityLevel') => {
    if (searchOptions.sortBy !== field) return null;
    return searchOptions.sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          {activeTab === 'students' && (
            <Link to="/students/add">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto mb-4">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="students" className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search students..."
                className="pl-10"
                value={debouncedSearchTerm}
                onChange={(e) => setDebouncedSearchTerm(e.target.value)}
              />
            </div>
            <Select 
              value={searchOptions.levelFilter} 
              onValueChange={(value) => setSearchOptions({ levelFilter: value })}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by level" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Mild">Mild</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Severe">Severe</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSortChange('name')}>
                  Name {getSortIcon('name')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('age')}>
                  Age {getSortIcon('age')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('grade')}>
                  Grade {getSortIcon('grade')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('disabilityLevel')}>
                  Disability Level {getSortIcon('disabilityLevel')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {isLoading ? (
            <StudentGridSkeleton />
          ) : filteredStudents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Suspense fallback={<StudentGridSkeleton />}>
                  {paginatedStudents.map(student => (
                    <StudentCard key={student.id} student={student} />
                  ))}
                </Suspense>
              </div>
              
              {/* Pagination Controls - Fixed at the bottom with smaller font */}
              <div className="sticky bottom-0 left-0 right-0 bg-background border-t py-3 px-4 mt-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, filteredStudents.length)} of {filteredStudents.length} students
                    </span>
                    <Select 
                      value={pagination.pageSize.toString()} 
                      onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-[90px] h-8 text-xs">
                        <SelectValue placeholder="Page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9" className="text-xs">9 per page</SelectItem>
                        <SelectItem value="18" className="text-xs">18 per page</SelectItem>
                        <SelectItem value="36" className="text-xs">36 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="h-8 w-8 p-0 flex items-center justify-center"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="h-8 w-8 p-0 text-xs flex items-center justify-center"
                      >
                        {page}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === totalPages}
                      className="h-8 w-8 p-0 flex items-center justify-center"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 bg-secondary rounded-lg">
              <p className="text-muted-foreground">No students found matching your criteria.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="teachers" className="pt-2">
          <TeacherManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
