import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, File } from 'lucide-react';
import { toast } from 'sonner';

interface FileMetadata {
  id: string;
  name: string;
  type: string;
  date: string;
  data?: string; // Base64 encoded file data
}

interface FileUploadProps {
  multiple?: boolean;
  onChange: (files: FileMetadata[]) => void;
  value?: FileMetadata[];
  maxFiles?: number;
  acceptedFileTypes?: string;
  label?: string;
}

const MAX_FILE_SIZE_MB = 10;

const FileUpload: React.FC<FileUploadProps> = ({
  multiple = false,
  onChange,
  value = [],
  maxFiles = 5,
  acceptedFileTypes = ".pdf,.jpg,.jpeg,.png", // ✅ Updated here
  label = "Choose File"
}) => {
  const [files, setFiles] = useState<FileMetadata[]>(value);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    try {
      const fileArray = Array.from(e.target.files);

      const filtered = fileArray.map(file => {
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name} exceeds ${MAX_FILE_SIZE_MB}MB limit`);
          return null;
        }
        return file;
      }).filter(Boolean) as File[];

      if (!multiple && filtered.length > 0) {
        const file = filtered[0];
        const base64Data = await fileToBase64(file);
        const newFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          date: new Date().toISOString().split('T')[0],
          data: base64Data
        };
        setFiles([newFile]);
        onChange([newFile]);
        return;
      }

      if (files.length + filtered.length > maxFiles) {
        toast.error(`You can only upload up to ${maxFiles} files`);
        return;
      }

      const processedFiles = await Promise.all(
        filtered.map(async (file) => {
          const base64Data = await fileToBase64(file);
          return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: file.type,
            date: new Date().toISOString().split('T')[0],
            data: base64Data
          };
        })
      );

      const updatedFiles = [...files, ...processedFiles];
      setFiles(updatedFiles);
      onChange(updatedFiles);

    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Error processing files. Please try again.');
    }
  }, [files, maxFiles, multiple, onChange]);

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
    onChange(updatedFiles);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="file"
          id={`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
          multiple={multiple}
          className="hidden"
          accept={acceptedFileTypes} // ✅ Now using extensions
          onChange={handleFileChange}
        />
        <label
          htmlFor={`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
          className="cursor-pointer inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <Upload className="mr-2 h-4 w-4" />
          {label} {multiple ? 'Files' : ''}
        </label>
        <p className="text-sm text-muted-foreground">
          {multiple ? `${files.length} of ${maxFiles} files uploaded` : files.length ? '1 file selected' : 'No file selected'}
        </p>
      </div>

      {files.length > 0 && (
        <div className="border rounded-md p-2 bg-secondary/30">
          <ul className="space-y-2">
            {files.map(file => (
              <li key={file.id} className="flex justify-between items-center p-2 bg-background rounded-md text-sm">
                <div className="flex items-center">
                  <File className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
