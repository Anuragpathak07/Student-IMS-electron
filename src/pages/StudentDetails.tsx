
import React from 'react';
import { useParams } from 'react-router-dom';
import StudentProfile from '@/components/student/StudentProfile';

const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Student ID is required</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl fade-in">
      <StudentProfile studentId={id} />
    </div>
  );
};

export default StudentDetails;
