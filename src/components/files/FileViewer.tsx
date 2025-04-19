
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FileViewerProps {
  file: {
    id: string;
    name: string;
    type: string;
    date: string;
    data?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, isOpen, onClose }) => {
  const [error, setError] = useState<string | null>(null);

  const renderFileContent = () => {
    if (!file.data) {
      return <div className="text-center p-4 text-destructive">File data is missing</div>;
    }

    // Determine how to display the file based on its type
    try {
      if (file.type.includes('image/')) {
        return <img src={file.data} alt={file.name} className="max-w-full max-h-[70vh] object-contain mx-auto" />;
      } else if (file.type.includes('pdf')) {
        return (
          <div className="h-[70vh] w-full">
            <iframe 
              src={file.data} 
              className="w-full h-full" 
              title={file.name}
            />
          </div>
        );
      } else if (file.type.includes('text/')) {
        // For text files, try to extract and display the content
        const contentStartIdx = file.data.indexOf('base64,') + 'base64,'.length;
        const base64Content = file.data.substring(contentStartIdx);
        const textContent = atob(base64Content);
        return (
          <div className="p-4 bg-secondary rounded-md overflow-auto max-h-[70vh]">
            <pre className="whitespace-pre-wrap">{textContent}</pre>
          </div>
        );
      } else {
        // For other file types, offer download
        return (
          <div className="text-center p-8">
            <p className="mb-4">This file type cannot be previewed directly.</p>
            <a 
              href={file.data} 
              download={file.name}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Download File
            </a>
          </div>
        );
      }
    } catch (err) {
      console.error('Error rendering file:', err);
      setError('Error displaying file. The file might be corrupted or in an unsupported format.');
      return (
        <div className="text-center p-4 text-destructive">
          {error || 'Error displaying file'}
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{file.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Uploaded on {file.date}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {renderFileContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileViewer;
