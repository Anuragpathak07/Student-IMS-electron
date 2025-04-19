
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, ArrowLeft, FileText, Hospital, Calendar, Trash2, AlertCircle, User, School, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { useStudentData, StudentDetail } from '@/hooks/useStudentData';
import { useTeacherData } from '@/hooks/useTeacherData';
import FileViewer from '@/components/files/FileViewer';

interface StudentProfileProps {
  studentId: string;
  isAdmin?: boolean;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ 
  studentId,
  isAdmin = true, // For demo purposes, assume admin role by default
}) => {
  const navigate = useNavigate();
  const { getStudentById, deleteStudent } = useStudentData();
  const { teachers } = useTeacherData();
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingFile, setViewingFile] = useState<{
    id: string;
    name: string;
    type: string;
    date: string;
    data?: string;
  } | null>(null);
  
  // Fetch student data based on ID
  const student = getStudentById(studentId);
  
  if (!student) {
    return (
      <div className="p-4 bg-destructive/20 rounded-md text-destructive">
        Student not found. The ID may be invalid.
      </div>
    );
  }

  const handleDeleteStudent = () => {
    setIsDeleting(true);
    deleteStudent(studentId);
    toast.success('Student deleted successfully');
    navigate('/dashboard');
    setIsDeleting(false);
  };
  
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

  // Ensure certificates exists or provide a default empty array
  const certificates = student.certificates || [];

  // Find teacher name based on ID
  const getTeacherName = (teacherId: string | undefined) => {
    if (!teacherId) return 'Not assigned';
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown teacher';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex space-x-2">
          <Button 
            onClick={() => navigate(`/students/edit/${studentId}`)}
            className="gap-1"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-1">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete {student.name}'s
                  record and all associated data.
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
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{student.name}</CardTitle>
              <CardDescription>
                Age: {student.age} • Grade: {student.grade} • {student.gender || 'Not specified'}
              </CardDescription>
            </div>
            <Badge variant="outline" className={getLevelColor(student.disabilityLevel)}>
              {student.disabilityLevel} {student.disabilityPercentage && `- ${student.disabilityPercentage}%`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              {isAdmin && <TabsTrigger value="sensitive">Sensitive Info</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Address</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{student.address || 'Not provided'}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.residenceType ? `${student.residenceType} Residence` : ''}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Disability Type</p>
                  <p className="text-sm text-muted-foreground">{student.disabilityType}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.hasDisabilityIdCard ? 'Has disability ID card' : 'No disability ID card'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Guardian Status</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{student.parentGuardianStatus || 'Not specified'}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">School Information</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Teacher: {getTeacherName(student.teacherAssigned)}
                  </p>
                  {student.previousSchool && (
                    <p className="text-xs text-muted-foreground">
                      Previous School: {student.previousSchool}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Emergency Contact</p>
                  <p className="text-sm text-muted-foreground">{student.emergencyContact || 'Not provided'}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Admission Date</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{student.admissionDate || 'Not provided'}</p>
                </div>
              </div>
              
              {student.otherNotes && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <div className="bg-secondary p-3 rounded-md">
                    <p className="text-sm">{student.otherNotes}</p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="medical" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Hospital className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Referred Hospital</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{student.referredHospital || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Medical History</p>
                  <div className="bg-secondary p-3 rounded-md">
                    <p className="text-sm">{student.medicalHistory || 'No medical history provided'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="pt-4">
              <div className="space-y-4">
                {student.hasDisabilityIdCard && student.disabilityIdCard && (
                  <div>
                    <p className="text-sm font-medium mb-2">Disability ID Card</p>
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{student.disabilityIdCard.name}</p>
                          <p className="text-xs text-muted-foreground">Uploaded on {student.disabilityIdCard.date}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewingFile(student.disabilityIdCard)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium mb-2">Certificates</p>
                  {certificates.length > 0 ? (
                    <div className="space-y-2">
                      {certificates.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">Uploaded on {doc.date}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setViewingFile(doc)}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-secondary/50 rounded-md">
                      <p className="text-sm text-muted-foreground">No certificates uploaded</p>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground mt-4">
                  <p>These documents require proper authorization to download.</p>
                </div>
              </div>
            </TabsContent>
            
            {isAdmin && (
              <TabsContent value="sensitive" className="pt-4">
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <div className="flex items-start space-x-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-700">Confidential Information</h3>
                      <p className="text-xs text-red-600">This information is restricted to authorized personnel only.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between p-2 hover:bg-red-100/50 rounded-md">
                      <p className="text-sm">Student has been abused or bullied</p>
                      <Badge variant={student.wasAbused ? "destructive" : "outline"}>
                        {student.wasAbused ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-baseline justify-between p-2 hover:bg-red-100/50 rounded-md">
                      <p className="text-sm">Home environment is safe</p>
                      <Badge variant={student.isSafeAtHome ? "outline" : "destructive"}>
                        {student.isSafeAtHome ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-baseline justify-between p-2 hover:bg-red-100/50 rounded-md">
                      <p className="text-sm">Family members are supportive</p>
                      <Badge variant={student.isFamilySupportive ? "outline" : "destructive"}>
                        {student.isFamilySupportive ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-baseline justify-between p-2 hover:bg-red-100/50 rounded-md">
                      <p className="text-sm">Student has PTSD</p>
                      <Badge variant={student.hasPTSD ? "destructive" : "outline"}>
                        {student.hasPTSD ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-baseline justify-between p-2 hover:bg-red-100/50 rounded-md">
                      <p className="text-sm">History of self-harm or suicide attempts</p>
                      <Badge variant={student.hasSelfHarmHistory ? "destructive" : "outline"}>
                        {student.hasSelfHarmHistory ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
      
      {viewingFile && (
        <FileViewer 
          file={viewingFile} 
          isOpen={Boolean(viewingFile)} 
          onClose={() => setViewingFile(null)} 
        />
      )}
    </div>
  );
};

export default StudentProfile;
