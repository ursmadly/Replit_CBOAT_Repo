import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface TaskCommentsProps {
  taskId: number;
  currentUser: {
    fullName: string;
    avatar?: string;
  };
  fromNotification?: boolean;
}

interface TaskComment {
  id: number;
  taskId: number;
  comment: string;
  createdBy: string;
  createdAt: Date;
  attachments?: string[];
  role?: string; // Optional role field
}

// Helper function to determine user role based on name
const determineUserRole = (name: string): string => {
  // Map of names to roles
  const roleMap: Record<string, string> = {
    'John Carter': 'CRA',
    'Lisa Wong': 'CRA',
    'Maria Rodriguez': 'Medical Monitor',
    'Mark Johnson': 'PI',
    'Dr. Sarah Johnson': 'Medical Monitor',
    'James Wilson': 'PI',
    'Emily Chen': 'CRA',
    'Robert Kim': 'PI'
  };
  
  return roleMap[name] || '';
};

export function TaskComments({ taskId, currentUser, fromNotification: fromNotificationProp }: TaskCommentsProps) {
  // Basic state
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userRole = determineUserRole(currentUser.fullName);

  // Allow override from props or check URL parameters
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams('');
  const fromNotification = fromNotificationProp || urlParams.get('from') === 'notification';
  const notificationMarkedRead = urlParams.get('notificationMarkedRead') === 'true';
  
  // Check if notification was marked read before navigation
  // This is a critical check that impacts our data fetching strategy
  console.log(`[TASK COMMENTS] fromNotification=${fromNotification}, notificationMarkedRead=${notificationMarkedRead}`);
  
  // IMPROVED APPROACH:
  // 1. For direct component access (not from notification) - standard loading
  // 2. For notification access WITH marked read status - we can trust the cache
  // 3. For notification access WITHOUT marked read status - we need to delay load until ready
  
  // State for delayed fetch handling
  const [commentsPreFetched, setCommentsPreFetched] = useState(false);
  const [manualComments, setManualComments] = useState<TaskComment[] | null>(null);
  const [manualError, setManualError] = useState<Error | null>(null);
  const [manualLoading, setManualLoading] = useState(fromNotification && !notificationMarkedRead);
  
  // Pre-fetch comments manually if coming from notification without mark-read status
  // OR if we're reopening the task from notification (fix for reopening issue)
  if ((fromNotification && !commentsPreFetched) || (fromNotification && !notificationMarkedRead)) {
    console.log(`[TASK COMMENTS NEW] Need to handle notification-based fetch sequence...`);
    
    // Mark that we've attempted the pre-fetch to avoid infinite loop
    setCommentsPreFetched(true);
    
    // Start with a small delay to allow mark-read to complete
    setTimeout(async () => {
      console.log(`[TASK COMMENTS NEW] Starting manual pre-fetch after delay...`);
      setManualLoading(true);
      
      try {
        // Attempt multiple fetches with increasing delays as needed
        let attempts = 0;
        let success = false;
        
        // Try up to 3 times with increased delays
        while (attempts < 3 && !success) {
          // Add delay between attempts (300ms, 600ms, 900ms)
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 300 * attempts));
          }
          
          try {
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 10);
            
            // Clear the existing cache first to prevent stale data
            queryClient.removeQueries({ queryKey: ['/api/tasks', taskId, 'comments'] });
            
            // Mark this as a special ultra-priority fetch with a unique cache buster
            const url = `/api/tasks/${taskId}/comments?super_priority=true&t=${timestamp}_${randomId}&from=notification`;
            console.log(`[TASK COMMENTS NEW] Manual fetch attempt ${attempts + 1}: ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Response not OK: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`[TASK COMMENTS NEW] Manual fetch success on attempt ${attempts + 1}, got ${data.length} comments`);
            
            // Success - update state
            setManualComments(data);
            setManualLoading(false);
            success = true;
            
            // Update both cache paths with fresh data to ensure consistent view
            queryClient.setQueryData(['/api/tasks', taskId, 'comments', 'notification'], data);
            queryClient.setQueryData(['/api/tasks', taskId, 'comments', 'standard'], data);
            
            // Show success toast for debugging purposes during dev, but hide in production
            if (data.length > 0 && process.env.NODE_ENV === 'development') {
              toast({
                title: "Comments loaded",
                description: `Loaded ${data.length} comments for task ${taskId}`,
                duration: 2000,
              });
            }
            
            // Break the loop
            break;
          } catch (fetchError) {
            console.error(`[TASK COMMENTS NEW] Attempt ${attempts + 1} failed:`, fetchError);
            attempts++;
            
            // If this was the last attempt and it failed, show error
            if (attempts === 3) {
              setManualError(fetchError as Error);
              setManualLoading(false);
              
              toast({
                title: "Error loading comments",
                description: "Failed to load comments after multiple attempts. Please try refreshing.",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        console.error('[TASK COMMENTS NEW] Critical error in manual fetch process:', error);
        setManualError(error as Error);
        setManualLoading(false);
        
        toast({
          title: "Error loading comments",
          description: "Failed to load comments. Please try again.",
          variant: "destructive",
        });
      }
    }, 250); // Initial delay to allow mark-read to complete
  }
  
  // Only use TanStack Query for standard loading paths
  // Skip it for notification-driven manual loading
  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    isError: isCommentsError,
    refetch: refetchComments
  } = useQuery<TaskComment[]>({
    queryKey: ['/api/tasks', taskId, 'comments', fromNotification ? 'notification' : 'standard'],
    queryFn: async () => {
      // Skip this for notification without marked read - we're handling manually
      if (fromNotification && !notificationMarkedRead) {
        console.log(`[TASK COMMENTS NEW] TanStack query skipped - using manual fetch instead`);
        return []; // Will never be used
      }
      
      console.log(`[TASK COMMENTS NEW] Standard TanStack query starting...`);
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 10);
      const cacheBusterParam = `t=${timestamp}_${randomId}`;
      
      // Standard fetch parameters
      const url = `/api/tasks/${taskId}/comments?${cacheBusterParam}${fromNotification ? '&from=notification' : ''}`;
      console.log(`[TASK COMMENTS NEW] Standard fetch from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[TASK COMMENTS NEW] Standard fetch successful, got ${data.length} comments`);
      return data;
    },
    enabled: !!(taskId && (!fromNotification || notificationMarkedRead)), // Only enable for standard paths
    refetchOnWindowFocus: false,
    staleTime: 30000
  });
  
  // DISPLAY LOGIC - combine manual and standard fetching paths
  const finalComments = manualComments || commentsData || [];
  const finalIsLoading = manualLoading || (isCommentsLoading && !manualComments);
  const finalIsError = (manualError !== null) || (isCommentsError && !manualComments);

  // Create a new comment
  const createCommentMutation = useMutation({
    mutationFn: async (newComment: { comment: string; createdBy: string; role?: string }) => {
      const result = await apiRequest(`/api/tasks/${taskId}/comments`, 'POST', newComment);
      return result;
    },
    onSuccess: (newCommentData: TaskComment) => {
      // Add to local state AND manualComments immediately for a responsive UI
      setComments((prevComments: TaskComment[]) => [...prevComments, newCommentData]);
      
      // If using manual comments, update them too
      if (manualComments) {
        setManualComments([...manualComments, newCommentData]);
      }
      
      // Also update cache for both standard and notification paths
      const standardCacheKey = ['/api/tasks', taskId, 'comments', 'standard'];
      const notificationCacheKey = ['/api/tasks', taskId, 'comments', 'notification'];
      
      // Update standard cache
      const standardCachedComments = queryClient.getQueryData<TaskComment[]>(standardCacheKey) || [];
      queryClient.setQueryData(standardCacheKey, [...standardCachedComments, newCommentData]);
      
      // Update notification cache if it exists
      const notificationCachedComments = queryClient.getQueryData<TaskComment[]>(notificationCacheKey) || [];
      queryClient.setQueryData(notificationCacheKey, [...notificationCachedComments, newCommentData]);
      
      // Invalidate tasks list to update any comment count/status
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Reset form
      setComment('');
      
      // Show success message
      toast({
        title: 'Comment added',
        description: 'Your comment has been added to the task',
      });
    },
    onError: (error) => {
      console.error('Failed to add comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!comment.trim()) return;
    
    // Store fullName as createdBy and userRole as role
    // This ensures we track who made the comment (username) separately from their role
    createCommentMutation.mutate({
      comment: comment.trim(),
      createdBy: currentUser.fullName, // Username stored in createdBy field
      role: userRole, // Role stored in role field
    });
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold">Task Discussion</h3>
      
      <Separator className="my-3" />
      
      {/* Comments List */}
      <div className="space-y-4">
        {finalIsLoading ? (
          <div className="text-center py-4 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <span>Loading comments{fromNotification && !notificationMarkedRead ? ' (notification mode)' : ''}...</span>
            {fromNotification && !notificationMarkedRead && (
              <div className="text-xs text-muted-foreground mt-2">
                Using special loading sequence for notification-triggered task
              </div>
            )}
          </div>
        ) : finalIsError ? (
          <div className="text-center py-4 text-red-500">
            <p>Error loading comments. Please try again.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                if (fromNotification && !notificationMarkedRead) {
                  // Reset and retry manual loading
                  setCommentsPreFetched(false);
                  setManualError(null);
                  setManualLoading(true);
                } else {
                  // Use standard refetch
                  refetchComments();
                }
              }}
            >
              Retry
            </Button>
          </div>
        ) : finalComments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No comments yet. Be the first to add a comment.
          </div>
        ) : (
          finalComments.map((commentItem: TaskComment) => (
            <Card key={commentItem.id} className="bg-muted/30">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={commentItem.createdBy} />
                    <AvatarFallback>{commentItem.createdBy.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  {(commentItem.role || determineUserRole(commentItem.createdBy)) ? (
                    <div className="text-xs px-2 py-1 rounded bg-primary-100 text-primary-700 font-medium">
                      {commentItem.createdBy} ({commentItem.role || determineUserRole(commentItem.createdBy)})
                    </div>
                  ) : (
                    <div className="font-medium">{commentItem.createdBy}</div>
                  )}
                  <div className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(commentItem.createdAt), 'MMM d, yyyy hh:mm a')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-3 px-4">
                <p className="whitespace-pre-line">{commentItem.comment}</p>
                {commentItem.attachments && commentItem.attachments.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium mb-1">Attachments:</h4>
                    <ul className="list-disc list-inside text-sm">
                      {commentItem.attachments.map((attachment: string, index: number) => (
                        <li key={index}>{attachment}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Add Comment Form */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Add Comment</CardTitle>
        </CardHeader>
        <CardContent className="py-3 px-4">
          <Textarea
            placeholder="Type your comment here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </CardContent>
        <CardFooter className="px-4 py-3 flex justify-between">
          {/* Future: Add attachment button */}
          <div></div>
          <Button 
            onClick={handleSubmit} 
            disabled={!comment.trim() || createCommentMutation.isPending}
          >
            {createCommentMutation.isPending ? 'Sending...' : 'Add Comment'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}