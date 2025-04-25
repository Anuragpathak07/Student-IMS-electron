import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import UserManagementComponent from '@/components/dashboard/UserManagement';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();

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
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <UserManagementComponent />
    </div>
  );
};

export default UserManagement; 