
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentForm from '@/components/forms/StudentForm';
import { useStudentData } from '@/hooks/useStudentData';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const EditStudent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStudentById, loadStudents } = useStudentData();
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) {
      toast.error('Please log in to edit students');
      navigate('/login');
      return;
    }
    
    // Ensure students are loaded
    loadStudents();
  }, [user, navigate, loadStudents]);
  
  if (!user) {
    return null;
  }
  
  const student = getStudentById(id || '');
  
  if (!student) {
    return (
      <div className="container mx-auto p-4 max-w-4xl fade-in">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div className="bg-destructive/20 p-4 rounded-md text-destructive">
          Student not found. The ID may be invalid.
        </div>
      </div>
    );
  }

  const handleStudentSaved = () => {
    // Navigate to the student details page immediately after saving
    navigate(`/students/${id}`);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl fade-in">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-6">Edit Student</h1>
      <StudentForm 
        initialData={student} 
        isEditing={true} 
        onSaved={handleStudentSaved}
      />
    </div>
  );
};

export default EditStudent;
