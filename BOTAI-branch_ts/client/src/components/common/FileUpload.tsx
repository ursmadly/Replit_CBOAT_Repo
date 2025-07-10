import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileUp, X, Check, AlertTriangle, File, FilePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUpload?: (files: File[]) => void;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  multiple?: boolean;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link";
  buttonText?: string;
  showIcon?: boolean;
  className?: string;
}

export default function FileUpload({ 
  onUpload, 
  maxSize = 10, // default 10MB
  allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"],
  multiple = false,
  buttonVariant = "outline",
  buttonText = "Upload Document",
  showIcon = true,
  className = ""
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // File size formatter
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return sizeInBytes + ' bytes';
    } else if (sizeInBytes < 1024 * 1024) {
      return (sizeInBytes / 1024).toFixed(1) + ' KB';
    } else {
      return (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };

  // File type validator
  const isValidFileType = (file: File): boolean => {
    return allowedTypes.includes(file.type);
  };

  // File size validator
  const isValidFileSize = (file: File): boolean => {
    return file.size <= maxSize * 1024 * 1024;
  };

  // Handle file change from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    processFiles(Array.from(selectedFiles));
  };

  // Process files for upload
  const processFiles = (fileList: File[]) => {
    const validFiles: File[] = [];
    const invalidFiles: {file: File, reason: string}[] = [];
    
    fileList.forEach(file => {
      if (!isValidFileType(file)) {
        invalidFiles.push({file, reason: 'Invalid file type'});
      } else if (!isValidFileSize(file)) {
        invalidFiles.push({file, reason: 'File too large'});
      } else {
        validFiles.push(file);
      }
    });
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file(s)",
        description: `${invalidFiles.length} file(s) couldn't be added`,
        variant: "destructive"
      });
    }
    
    if (validFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(active);
  };

  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Trigger hidden file input
  const triggerFileInput = () => {
    inputRef.current?.click();
  };

  // Simulate upload progress
  const simulateUploadProgress = () => {
    setUploading(true);
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setUploading(false);
          
          // Call the onUpload callback with the files
          if (onUpload) {
            onUpload(files);
          }
          
          // Close dialog after a short delay
          setTimeout(() => {
            setOpen(false);
            setFiles([]);
            setProgress(0);
            
            toast({
              title: "Upload complete",
              description: `Successfully uploaded ${files.length} file(s)`,
              variant: "default"
            });
          }, 500);
          
          return 100;
        }
        return newProgress;
      });
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          className={`gap-2 ${className}`}
        >
          {showIcon && <FilePlus size={16} />}
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload documents to the system. Supported formats: PDF, Word, JPEG, PNG.
          </DialogDescription>
        </DialogHeader>
        
        <div
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer mt-4 
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
          onClick={triggerFileInput}
          onDragOver={(e) => handleDrag(e, true)}
          onDragEnter={(e) => handleDrag(e, true)}
          onDragLeave={(e) => handleDrag(e, false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            multiple={multiple}
            accept={allowedTypes.join(',')}
            className="hidden"
            onChange={handleFileChange}
          />
          
          <div className="flex flex-col items-center justify-center">
            <FileUp className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm font-medium">
              Drag and drop files here or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: {maxSize}MB
            </p>
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Selected Files ({files.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, index) => (
                <div 
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <File className="h-4 w-4 text-primary" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <DialogFooter className="flex justify-between items-center mt-4">
          <div>
            {files.length > 0 && (
              <Badge variant="outline" className="mr-2">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              onClick={simulateUploadProgress} 
              disabled={uploading || files.length === 0}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}