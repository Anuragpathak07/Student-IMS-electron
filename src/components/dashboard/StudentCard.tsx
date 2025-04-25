import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudentData } from '@/hooks/useStudentData';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type Student = {
  id: string;
  name: string;
  age: number;
  grade: string;
  disabilityType: string;
  disabilityLevel: 'Mild' | 'Moderate' | 'Severe';
};

interface StudentCardProps {
  student: Student;
  onDelete?: () => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onDelete }) => {
  const { deleteStudent } = useStudentData();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Mild':
        return 'bg-green-100 text-green-800';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Severe':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteStudent = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await deleteStudent(student.id);
      setIsDeleteOpen(false);
      onDelete?.();
    } catch (error) {
      console.error('Error deleting student:', error);
      setError('Failed to delete student. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="hover-scale overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{student.name}</h3>
            <p className="text-muted-foreground text-sm">Age: {student.age} • Grade: {student.grade}</p>
          </div>
          <Badge variant="outline" className={getLevelColor(student.disabilityLevel)}>
            {student.disabilityLevel}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Disability:</span> {student.disabilityType}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between bg-secondary/50 p-3">
        <Link to={`/students/${student.id}`}>
          <Button variant="ghost" size="sm" className="text-xs">
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
        </Link>
        <div className="flex gap-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {student.name}'s record and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteStudent}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Link to={`/students/edit/${student.id}`}>
            <Button variant="ghost" size="sm" className="text-xs">
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default StudentCard;
