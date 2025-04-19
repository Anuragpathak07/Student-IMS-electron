import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useStudentData, StudentDetail } from '@/hooks/useStudentData';
import { useTeacherData } from '@/hooks/useTeacherData';
import FileUpload from './FileUpload';
import { AlertCircle, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.coerce.number().int().min(5).max(22),
  grade: z.string().min(1, 'Grade is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  disabilityType: z.string().min(1, 'Disability type is required'),
  disabilityLevel: z.enum(['Mild', 'Moderate', 'Severe']),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  residenceType: z.enum(['Permanent', 'Temporary']),
  previousSchool: z.string().optional(),
  parentGuardianStatus: z.enum(['Both Parents', 'Single Parent', 'Guardian', 'Orphan']),
  teacherAssigned: z.string().min(1, 'Teacher assignment is required'),
  disabilityPercentage: z.coerce.number().min(0).max(100),
  hasDisabilityIdCard: z.boolean().default(false),
  medicalHistory: z.string().optional(),
  referredHospital: z.string().optional(),
  emergencyContact: z.string().optional(),
  admissionDate: z.string().optional(),
  otherNotes: z.string().optional(),
  // Sensitive info fields
  wasAbused: z.boolean().default(false),
  isSafeAtHome: z.boolean().default(true),
  isFamilySupportive: z.boolean().default(true),
  hasPTSD: z.boolean().default(false),
  hasSelfHarmHistory: z.boolean().default(false),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
  initialData?: Partial<StudentDetail>;
  isEditing?: boolean;
  isAdmin?: boolean;
  onSaved?: () => void; // Callback when form is saved
}

const StudentForm: React.FC<StudentFormProps> = ({
  initialData = {},
  isEditing = false,
  isAdmin = true, // For demo purposes, assume admin role by default
  onSaved,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addStudent, updateStudent, loadStudents } = useStudentData();
  const { teachers, addTeacher } = useTeacherData();
  const [newTeacherName, setNewTeacherName] = useState('');
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [certificates, setCertificates] = useState<Array<{id: string, name: string, type: string, date: string, data?: string}>>(
    initialData.certificates || []
  );
  const [disabilityIdCard, setDisabilityIdCard] = useState<{id: string, name: string, type: string, date: string, data?: string} | undefined>(
    initialData.disabilityIdCard
  );

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: initialData.name || '',
      age: initialData.age || undefined,
      grade: initialData.grade || '',
      gender: initialData.gender || 'Male',
      address: initialData.address || '',
      residenceType: initialData.residenceType || 'Permanent',
      previousSchool: initialData.previousSchool || '',
      parentGuardianStatus: initialData.parentGuardianStatus || 'Both Parents',
      teacherAssigned: initialData.teacherAssigned || (teachers.length > 0 ? teachers[0]?.id : ''),
      disabilityType: initialData.disabilityType || '',
      disabilityLevel: initialData.disabilityLevel || 'Mild',
      disabilityPercentage: initialData.disabilityPercentage || undefined,
      hasDisabilityIdCard: initialData.hasDisabilityIdCard || false,
      medicalHistory: initialData.medicalHistory || '',
      referredHospital: initialData.referredHospital || '',
      emergencyContact: initialData.emergencyContact || '',
      admissionDate: initialData.admissionDate || '',
      otherNotes: initialData.otherNotes || '',
      // Sensitive info
      wasAbused: initialData.wasAbused || false,
      isSafeAtHome: initialData.isSafeAtHome !== undefined ? initialData.isSafeAtHome : true,
      isFamilySupportive: initialData.isFamilySupportive !== undefined ? initialData.isFamilySupportive : true,
      hasPTSD: initialData.hasPTSD || false,
      hasSelfHarmHistory: initialData.hasSelfHarmHistory || false,
    },
  });

  // Watch the hasDisabilityIdCard field to conditionally show the upload
  const hasDisabilityIdCard = form.watch('hasDisabilityIdCard');

  const handleAddTeacher = () => {
    if (newTeacherName.trim()) {
      const teacher = addTeacher(newTeacherName.trim());
      if (teacher) {
        form.setValue('teacherAssigned', teacher.id);
        setNewTeacherName('');
        setIsAddingTeacher(false);
        toast.success(`Teacher "${teacher.name}" has been added`);
      }
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);
    
    try {
      // Prepare student data with file uploads
      const studentData: Partial<StudentDetail> = {
        name: data.name,
        age: data.age,
        grade: data.grade,
        gender: data.gender,
        disabilityType: data.disabilityType,
        disabilityLevel: data.disabilityLevel,
        address: data.address,
        residenceType: data.residenceType,
        parentGuardianStatus: data.parentGuardianStatus,
        teacherAssigned: data.teacherAssigned,
        disabilityPercentage: data.disabilityPercentage,
        hasDisabilityIdCard: data.hasDisabilityIdCard,
        // Optional fields
        previousSchool: data.previousSchool || '',
        medicalHistory: data.medicalHistory || '',
        referredHospital: data.referredHospital || '',
        emergencyContact: data.emergencyContact || '',
        admissionDate: data.admissionDate || '',
        otherNotes: data.otherNotes || '',
        // Sensitive info
        wasAbused: data.wasAbused,
        isSafeAtHome: data.isSafeAtHome,
        isFamilySupportive: data.isFamilySupportive,
        hasPTSD: data.hasPTSD,
        hasSelfHarmHistory: data.hasSelfHarmHistory,
        // File uploads
        certificates,
        disabilityIdCard: data.hasDisabilityIdCard ? disabilityIdCard : undefined
      };
      
      if (isEditing && id) {
        // For updates, we need to preserve the existing ID
        updateStudent(id, studentData);
        toast.success('Student updated successfully!');
      } else {
        // For new students, we need to include all required fields
        const newStudent = addStudent(studentData as Omit<StudentDetail, 'id'>);
        if (newStudent) {
          toast.success('Student added successfully!');
        } else {
          toast.error('Failed to add student');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Ensure data is loaded after changes
      loadStudents();
      
      if (onSaved) {
        onSaved();
      } else {
        navigate('/dashboard');
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-primary/5 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter student name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter age" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade/Class</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter grade or class" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="bg-primary/5 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Residence & Background</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="residenceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Residence Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Permanent">Permanent</SelectItem>
                      <SelectItem value="Temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="previousSchool"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous School</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter previous school (if any)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="parentGuardianStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent/Guardian Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Both Parents">Both Parents</SelectItem>
                      <SelectItem value="Single Parent">Single Parent</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                      <SelectItem value="Orphan">Orphan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="bg-primary/5 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Disability Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="disabilityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disability Type</FormLabel>
                  <FormControl>
                    <Input placeholder="Type of disability" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="disabilityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disability Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mild">Mild</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="disabilityPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disability Percentage</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Percentage (0-100)" 
                      min="0" 
                      max="100" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hasDisabilityIdCard"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Has Disability ID Card?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === 'true')}
                      defaultValue={field.value ? 'true' : 'false'}
                      className="flex flex-row space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="true" />
                        </FormControl>
                        <FormLabel className="font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="false" />
                        </FormControl>
                        <FormLabel className="font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {hasDisabilityIdCard && (
            <div className="mt-4 p-3 border border-dashed rounded-md">
              <FormLabel className="block mb-2">Upload Disability ID Card</FormLabel>
              <FileUpload 
                multiple={false}
                value={disabilityIdCard ? [disabilityIdCard] : []}
                onChange={(files) => setDisabilityIdCard(files[0])}
                label="Choose ID Card"
              />
            </div>
          )}
        </div>
          
        <div className="bg-primary/5 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-4">School & Medical Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="teacherAssigned"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher Assigned</FormLabel>
                  <div className="flex gap-2">
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map(teacher => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Dialog open={isAddingTeacher} onOpenChange={setIsAddingTeacher}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" type="button">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Teacher</DialogTitle>
                          <DialogDescription>
                            Enter the name of the new teacher to add them to the system.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Input
                            placeholder="Teacher's name"
                            value={newTeacherName}
                            onChange={(e) => setNewTeacherName(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddingTeacher(false)}>Cancel</Button>
                          <Button onClick={handleAddTeacher} disabled={!newTeacherName.trim()}>Add Teacher</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="referredHospital"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referred Hospital</FormLabel>
                  <FormControl>
                    <Input placeholder="Hospital name (if applicable)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Name and phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="admissionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admission Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-4">
            <FormField
              control={form.control}
              name="medicalHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical History</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter relevant medical history" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="bg-primary/5 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Certificates</h2>
          
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Upload certificates or medical reports</p>
            <FileUpload 
              multiple={true}
              value={certificates}
              onChange={setCertificates}
              maxFiles={5}
              label="Choose Certificates"
              acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
            />
          </div>
          
          <FormField
            control={form.control}
            name="otherNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Other Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any additional notes or information" 
                    className="min-h-[100px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {isAdmin && (
          <div className="bg-red-50 p-4 rounded-md mb-6 border border-red-200">
            <div className="flex items-start space-x-2 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-red-700">Sensitive Information (Admin Only)</h2>
                <p className="text-sm text-red-600">This information is only visible to administrators and is kept confidential.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="wasAbused"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 hover:bg-red-100/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Student has been abused or bullied
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isSafeAtHome"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 hover:bg-red-100/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Home environment is safe
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isFamilySupportive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 hover:bg-red-100/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Family members are supportive
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hasPTSD"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 hover:bg-red-100/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Student has PTSD
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hasSelfHarmHistory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 hover:bg-red-100/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        History of self-harm or suicide attempts
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Student' : 'Add Student'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StudentForm;
