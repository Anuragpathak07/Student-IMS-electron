import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getStorageItem, setStorageItem } from '@/utils/storage';
import { toast } from 'sonner';
import { Eye, EyeOff, RefreshCw, User, Lock, Edit2, Trash2, Save, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Memoized user card component
const UserCard = React.memo(({ 
  user, 
  showPassword, 
  newPassword,
  onTogglePassword,
  onPasswordChange,
  onResetPassword,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  isEditing,
  onSaveEdit,
  onCancelEdit,
  editedUser,
  onEditChange
}: {
  user: any;
  showPassword: boolean;
  newPassword: string;
  onTogglePassword: () => void;
  onPasswordChange: (value: string) => void;
  onResetPassword: () => void;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  editedUser: any;
  onEditChange: (field: string, value: string) => void;
}) => (
  <div 
    className={`border rounded-lg p-3 space-y-3 transition-all ${
      isSelected ? 'border-primary bg-primary/5' : 'border-border'
    }`}
  >
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          {isEditing ? (
            <Input
              value={editedUser.name}
              onChange={(e) => onEditChange('name', e.target.value)}
              className="h-7 text-sm"
            />
          ) : (
            <>
              <h4 className="font-medium">{user.name}</h4>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSaveEdit}
              className="h-8 w-8 text-green-600 hover:text-green-700"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancelEdit}
              className="h-8 w-8 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
          </>
        )}
      </div>
    </div>
    
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
  </div>
));

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Array<any>>([]);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [newPasswords, setNewPasswords] = useState<{ [key: string]: string }>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

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

  const handleEdit = useCallback((userId: string) => {
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      setEditingUser(userId);
      setEditedUser({ ...userToEdit });
    }
  }, [users]);

  const handleSaveEdit = useCallback(() => {
    if (!editingUser || !editedUser) return;

    const updatedUsers = users.map(u => {
      if (u.id === editingUser) {
        return { ...editedUser };
      }
      return u;
    });

    setStorageItem('users', 'system', updatedUsers);
    setUsers(updatedUsers);
    setEditingUser(null);
    setEditedUser(null);
    toast.success('User updated successfully');
  }, [users, editingUser, editedUser]);

  const handleCancelEdit = useCallback(() => {
    setEditingUser(null);
    setEditedUser(null);
  }, []);

  const handleEditChange = useCallback((field: string, value: string) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleDelete = useCallback((userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!userToDelete) return;

    const updatedUsers = users.filter(u => u.id !== userToDelete);
    setStorageItem('users', 'system', updatedUsers);
    setUsers(updatedUsers);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
    toast.success('User deleted successfully');
  }, [users, userToDelete]);

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
          onEdit={() => handleEdit(user.id)}
          onDelete={() => handleDelete(user.id)}
          isEditing={editingUser === user.id}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          editedUser={editedUser}
          onEditChange={handleEditChange}
        />
      ))}
    </div>
  ), [users, showPasswords, newPasswords, selectedUser, editingUser, editedUser, 
      togglePasswordVisibility, handlePasswordChange, resetPassword, 
      handleEdit, handleDelete, handleSaveEdit, handleCancelEdit, handleEditChange]);

  return (
    <div className="w-full max-h-[60vh]">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">User Management</h3>
      </div>
      
      <ScrollArea className="h-[50vh] pr-4">
        {userList}
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default React.memo(UserManagement); 