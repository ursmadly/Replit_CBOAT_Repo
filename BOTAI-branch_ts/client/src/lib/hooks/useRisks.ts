import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateRiskLevel } from "@/lib/utils/calculations";

interface RiskProfileFilters {
  entityType: string;
  entityId: number;
  profileType?: string;
}

export function useRiskProfiles({ entityType, entityId, profileType }: RiskProfileFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/riskprofiles/${entityType}/${entityId}`],
    select: (data: any[]) => {
      if (profileType) {
        return data.filter((profile: any) => profile.profileType === profileType);
      }
      return data;
    },
    enabled: !!entityType && !!entityId
  });
  
  return { profiles: data || [], isLoading, error };
}

// Direct hook to get all profiles by type
export function useProfilesByType(profileType: string) {
  console.log(`Fetching profiles for type: ${profileType}`);
  
  // Fetch all entity types and manually filter by profileType
  const { data: allProfiles, isLoading, error } = useQuery({
    queryKey: ['/api/riskprofiles/all'],
    queryFn: async () => {
      // Get all profiles across all entity types
      const allProfiles = [];
      
      // Entity types to check
      const entityTypes = ['trial', 'site', 'resource', 'vendor'] as const;
      
      // IDs to check for each entity type
      const entityIds: Record<string, number[]> = {
        'trial': [1, 2, 3],
        'site': [1, 2, 3, 4, 5],
        'resource': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        'vendor': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
      };
      
      // Fetch profiles for each entity type and ID
      for (const entityType of entityTypes) {
        for (const id of entityIds[entityType]) {
          try {
            const response = await fetch(`/api/riskprofiles/${entityType}/${id}`);
            if (response.ok) {
              const profiles = await response.json();
              allProfiles.push(...profiles);
            }
          } catch (error) {
            console.error(`Error fetching profiles for ${entityType}/${id}:`, error);
          }
        }
      }
      
      return allProfiles;
    }
  });
  
  // Filter profiles by profile type (case-insensitive)
  const filteredProfiles = (allProfiles || []).filter((profile: any) => 
    profile.profileType.toLowerCase() === profileType.toLowerCase()
  );
  
  console.log(`Found ${filteredProfiles.length} profiles of type ${profileType}`);
  
  return { 
    profiles: filteredProfiles,
    isLoading, 
    error,
    // For debugging
    allProfiles
  };
}

export function useSignalDetections(priority?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/signaldetections'],
    select: (data: any[]) => {
      let filtered = [...data];
      
      if (priority) {
        filtered = filtered.filter((signal: any) => signal.priority === priority);
      }
      
      // Sort by priority then by date (newest first)
      return filtered.sort((a: any, b: any) => {
        const priorityOrder: Record<string, number> = {
          'Critical': 0,
          'High': 1,
          'Medium': 2,
          'Low': 3
        };
        
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        // If priority is the same, sort by created date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
  });
  
  return { signals: data || [], isLoading, error };
}

export function useCreateSignal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async (signalData: any) => {
      return apiRequest('/api/signaldetections', 'POST', signalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/signaldetections'] });
      toast({
        title: "Signal created",
        description: "The risk signal has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create signal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  return mutation;
}

export function useUpdateSignal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: any }) => {
      return apiRequest(`/api/signaldetections/${id}`, 'PATCH', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/signaldetections'] });
      toast({
        title: "Signal updated",
        description: "The risk signal has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update signal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  return mutation;
}

export function useRiskThresholds(trialId: number) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/trials/${trialId}/thresholds`],
    enabled: !!trialId
  });
  
  return { thresholds: data || [], isLoading, error };
}

export function useCreateRiskThreshold() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async (thresholdData: any) => {
      return apiRequest('/api/thresholds', 'POST', thresholdData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/trials/${variables.trialId}/thresholds`] });
      toast({
        title: "Threshold created",
        description: "The risk threshold has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create threshold: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  return mutation;
}

export function useUpdateRiskThreshold() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async ({ id, updates, trialId }: { id: number, updates: any, trialId: number }) => {
      return apiRequest(`/api/thresholds/${id}`, 'PATCH', updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/trials/${variables.trialId}/thresholds`] });
      toast({
        title: "Threshold updated",
        description: "The risk threshold has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update threshold: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  return mutation;
}

export function useTriggerAIDetection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async (detectionParams: {
      trialId: number;
      dataSource: string;
      dataPoints: any[];
    }) => {
      return apiRequest('/api/ai/detectsignals', 'POST', detectionParams);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/signaldetections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: "AI Detection Complete",
        description: `Detected ${data.detections?.length || 0} risk signals`,
      });
    },
    onError: (error) => {
      toast({
        title: "Detection Error",
        description: `Failed to run AI detection: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  return mutation;
}
