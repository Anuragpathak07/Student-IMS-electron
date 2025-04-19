
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentData } from '@/hooks/useStudentData';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
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

const TeacherManagement: React.FC = () => {
  const { teachers, addTeacher, deleteTeacher } = useStudentData();
  const [newTeacherName, setNewTeacherName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTeacher = () => {
    if (!newTeacherName.trim()) {
      toast.error('Teacher name cannot be empty');
      return;
    }

    setIsAdding(true);
    
    // Add a slight delay to simulate API call
    setTimeout(() => {
      const teacher = addTeacher(newTeacherName);
      if (teacher) {
        toast.success(`Teacher "${newTeacherName}" added successfully`);
        setNewTeacherName('');
      } else {
        toast.error('Failed to add teacher');
      }
      setIsAdding(false);
    }, 500);
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    deleteTeacher(id);
    toast.success(`Teacher "${name}" removed`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Teacher Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter teacher name"
              value={newTeacherName}
              onChange={(e) => setNewTeacherName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleAddTeacher} 
              disabled={isAdding || !newTeacherName.trim()}
              className="whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Teacher
            </Button>
          </div>

          {teachers.length > 0 ? (
            <div className="space-y-2">
              {teachers.map((teacher) => (
                <div 
                  key={teacher.id} 
                  className="flex justify-between items-center p-2 bg-secondary rounded-md"
                >
                  <span>{teacher.name}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove {teacher.name} from your teachers list and unassign them from any students.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-secondary/50 p-4 rounded-md flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No teachers added yet. Add teachers to assign them to students.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherManagement;
