import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { TaskPriority, TaskStatus } from "@shared/schema";

const taskSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum([TaskPriority.CRITICAL, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW]),
  trialId: z.number(),
  siteId: z.number().optional(),
  assignedTo: z.string().optional(),
  details: z.string().optional(),
  dueDate: z.string(),
  detectionId: z.number().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

type TaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signalId?: number | null;
};

export default function TaskModal({ open, onOpenChange, signalId }: TaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  interface Trial {
    id: number;
    protocolId: string;
    title: string;
  }
  
  const { data: trials = [] } = useQuery<Trial[]>({
    queryKey: ['/api/trials'],
    queryFn: () => apiRequest('/api/trials', 'GET'),
    enabled: open
  });
  
  interface Site {
    id: number;
    siteId: string;
    name: string;
  }
  
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
    queryFn: () => apiRequest('/api/sites', 'GET'),
    enabled: open
  });
  
  interface SignalDetection {
    id: number;
    detectionId: string;
    trialId: number;
    siteId: number | null;
    observation: string;
    priority: string;
    status: string;
  }
  
  // Fetch signal detection data if signalId is provided
  const { data: signalData } = useQuery<SignalDetection>({
    queryKey: ['/api/signaldetections', signalId],
    queryFn: () => apiRequest(`/api/signaldetections/${signalId}`, 'GET'),
    enabled: !!signalId && open
  });

  // Get date 7 days from now formatted as yyyy-MM-dd for the date input
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: TaskPriority.MEDIUM,
      trialId: 1, // Default to first trial
      details: "",
      dueDate: getDefaultDueDate(),
      detectionId: signalId || undefined,
    }
  });
  
  // Update form when signalData changes
  useEffect(() => {
    if (signalData) {
      // Pre-populate form with signal detection data
      form.setValue('title', `Address ${signalData.detectionId} signal`);
      form.setValue('description', `Task created to address signal: ${signalData.observation}`);
      form.setValue('trialId', signalData.trialId);
      if (signalData.siteId) {
        form.setValue('siteId', signalData.siteId);
      }
      
      // Set priority based on signal priority
      switch (signalData.priority.toLowerCase()) {
        case 'critical':
          form.setValue('priority', TaskPriority.CRITICAL);
          break;
        case 'high':
          form.setValue('priority', TaskPriority.HIGH);
          break;
        case 'medium':
          form.setValue('priority', TaskPriority.MEDIUM);
          break;
        case 'low':
          form.setValue('priority', TaskPriority.LOW);
          break;
        default:
          form.setValue('priority', TaskPriority.MEDIUM);
      }
      
      form.setValue('detectionId', signalData.id);
    }
  }, [signalData, form]);

  const createTaskMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      // Create a new task object, let server generate taskId and handle due date
      console.log("Submitting task with values:", values);
      
      return apiRequest('/api/tasks', 'POST', {
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: TaskStatus.NOT_STARTED,
        trialId: values.trialId,
        siteId: values.siteId,
        assignedTo: values.assignedTo,
        createdBy: "Dr. Sarah Johnson", // Current user
        dueDate: values.dueDate,
        detectionId: values.detectionId // Link to signal detection
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task created successfully",
        variant: "default",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const onSubmit = (values: TaskFormValues) => {
    setIsSubmitting(true);
    createTaskMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-neutral-900">Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task for risk management and issue tracking.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Risk Investigation">Risk Investigation</SelectItem>
                        <SelectItem value="Protocol Deviation">Protocol Deviation</SelectItem>
                        <SelectItem value="Safety Investigation">Safety Investigation</SelectItem>
                        <SelectItem value="Quality Review">Quality Review</SelectItem>
                        <SelectItem value="Data Clarification">Data Clarification</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      placeholder="Describe the task..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TaskPriority.CRITICAL}>Critical</SelectItem>
                          <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                          <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                          <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="siteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select site" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Multiple Sites</SelectItem>
                          {sites.map((site) => (
                            <SelectItem key={site.id} value={site.id.toString()}>
                              {site.siteId} - {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="John Carter">John Carter</SelectItem>
                          <SelectItem value="Lisa Wong">Lisa Wong</SelectItem>
                          <SelectItem value="Maria Rodriguez">Maria Rodriguez</SelectItem>
                          <SelectItem value="Mark Johnson">Mark Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={4} 
                      placeholder="Add any additional context or information..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Attach Files</FormLabel>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <span className="material-icons text-neutral-400 text-3xl">cloud_upload</span>
                  <div className="flex text-sm text-neutral-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500">
                    PDF, Word, Excel, or image files up to 10MB
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
