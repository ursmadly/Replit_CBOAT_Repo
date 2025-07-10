import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

// Form validation schema
const formSchema = z.object({
  observation: z.string().min(5, "Observation must be at least 5 characters"),
  dataReference: z.string().min(1, "Data reference is required"),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  trialId: z.number().optional(),
});

type CreateSignalFormValues = z.infer<typeof formSchema>;

type CreateSignalFormProps = {
  onSuccess?: () => void;
  trialId?: number;
};

export default function CreateSignalForm({ onSuccess, trialId }: CreateSignalFormProps) {
  const [isAiDetecting, setIsAiDetecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form setup
  const form = useForm<CreateSignalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      observation: "",
      dataReference: "",
      priority: "Medium",
      trialId: trialId,
    },
  });
  
  // Mutation for creating a signal
  const createSignalMutation = useMutation({
    mutationFn: async (values: CreateSignalFormValues) => {
      const response = await fetch('/api/signaldetections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error('Failed to create signal detection');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Signal detection created",
        description: "The new signal has been successfully created.",
      });
      
      // Invalidate queries to refresh data
      if (trialId) {
        queryClient.invalidateQueries({ queryKey: ['/api/trials', trialId, 'signaldetections'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/signaldetections'] });
      }
      
      // Reset form
      form.reset();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create signal",
        description: "There was an error creating the signal detection.",
        variant: "destructive",
      });
    },
  });
  
  // AI Detection mutation
  const detectSignalsMutation = useMutation({
    mutationFn: async (data: { trialId?: number }) => {
      const response = await fetch('/api/ai/detectsignals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to detect signals using AI');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data && data.observation) {
        form.setValue('observation', data.observation);
        form.setValue('dataReference', data.dataReference || form.getValues('dataReference'));
        form.setValue('priority', data.priority || form.getValues('priority'));
      }
      
      setIsAiDetecting(false);
      
      toast({
        title: "AI Detection Complete",
        description: "Potential signals have been analyzed and populated.",
      });
    },
    onError: () => {
      setIsAiDetecting(false);
      toast({
        title: "AI Detection Failed",
        description: "Failed to run AI detection on the trial data.",
        variant: "destructive",
      });
    }
  });
  
  const runAiDetection = () => {
    setIsAiDetecting(true);
    detectSignalsMutation.mutate({ trialId });
  };
  
  const onSubmit = (values: CreateSignalFormValues) => {
    createSignalMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="observation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observation</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter the observed signal or finding"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="dataReference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Reference</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter reference to data source"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={runAiDetection}
            disabled={isAiDetecting}
          >
            {isAiDetecting ? "Detecting..." : "AI Detect Signals"}
          </Button>
          
          <Button 
            type="submit" 
            disabled={createSignalMutation.isPending}
          >
            {createSignalMutation.isPending ? "Creating..." : "Create Signal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}