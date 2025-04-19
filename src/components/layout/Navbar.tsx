
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to={user ? '/dashboard' : '/'} className="text-xl font-bold">
            Student IMS
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex text-sm">
                Welcome, {user.name}
              </div>
              <Button 
                variant="ghost" 
                onClick={logout} 
                className="text-primary-foreground hover:bg-primary/90"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary/90">
                <User className="h-4 w-4 mr-2" />
                <span>Login</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
