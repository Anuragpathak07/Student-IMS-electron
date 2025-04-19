
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentForm from '@/components/forms/StudentForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const AddStudent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) {
      toast.error('Please log in to add students');
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleStudentSaved = () => {
    // Navigate to the dashboard after successfully saving
    navigate('/dashboard');
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
      <h1 className="text-2xl font-bold mb-6">Add New Student</h1>
      <StudentForm onSaved={handleStudentSaved} />
    </div>
  );
};

export default AddStudent;
