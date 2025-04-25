import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getStorageItem, setStorageItem } from '@/utils/storage';
import { toast } from 'sonner';
import { Eye, EyeOff, RefreshCw, User, Lock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Memoized user card component
const UserCard = React.memo(({ 
  user, 
  showPassword, 
  newPassword,
  onTogglePassword,
  onPasswordChange,
  onResetPassword,
  isSelected,
  onSelect
}: {
  user: any;
  showPassword: boolean;
  newPassword: string;
  onTogglePassword: () => void;
  onPasswordChange: (value: string) => void;
  onResetPassword: () => void;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <div 
    className={`border rounded-lg p-3 space-y-3 transition-all ${
      isSelected ? 'border-primary bg-primary/5' : 'border-border'
    }`}
    onClick={onSelect}
  >
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h4 className="font-medium">{user.name}</h4>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePassword();
        }}
        className="h-8 w-8"
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
    
    {isSelected && (
      <div className="space-y-2 pl-10">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Current Password</Label>
          <div className="flex items-center gap-2">
            <Input
              type={showPassword ? "text" : "password"}
              value={user.password}
              readOnly
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">New Password</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Enter new password"
                className="pl-10 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onResetPassword();
              }}
              disabled={!newPassword}
              className="h-9"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>
    )}
  </div>
));

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Array<any>>([]);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [newPasswords, setNewPasswords] = useState<{ [key: string]: string }>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Load users on component mount
  React.useEffect(() => {
    const loadUsers = () => {
      const storedUsers = getStorageItem<Array<any>>('users', 'system', []);
      setUsers(storedUsers);
    };
    loadUsers();
  }, []);

  const togglePasswordVisibility = useCallback((userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  }, []);

  const handlePasswordChange = useCallback((userId: string, value: string) => {
    setNewPasswords(prev => ({
      ...prev,
      [userId]: value
    }));
  }, []);

  const resetPassword = useCallback((userId: string) => {
    if (!newPasswords[userId]) {
      toast.error('Please enter a new password');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          password: newPasswords[userId]
        };
      }
      return u;
    });

    setStorageItem('users', 'system', updatedUsers);
    setUsers(updatedUsers);
    setNewPasswords(prev => {
      const { [userId]: _, ...rest } = prev;
      return rest;
    });
    toast.success('Password reset successfully');
  }, [users, newPasswords]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Memoize the user list
  const userList = useMemo(() => (
    <div className="space-y-3">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          showPassword={showPasswords[user.id] || false}
          newPassword={newPasswords[user.id] || ''}
          onTogglePassword={() => togglePasswordVisibility(user.id)}
          onPasswordChange={(value) => handlePasswordChange(user.id, value)}
          onResetPassword={() => resetPassword(user.id)}
          isSelected={selectedUser === user.id}
          onSelect={() => setSelectedUser(user.id)}
        />
      ))}
    </div>
  ), [users, showPasswords, newPasswords, selectedUser, togglePasswordVisibility, handlePasswordChange, resetPassword]);

  return (
    <div className="w-full max-h-[60vh]">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">User Management</h3>
      </div>
      
      <ScrollArea className="h-[50vh] pr-4">
        {userList}
      </ScrollArea>
    </div>
  );
};

export default React.memo(UserManagement); 