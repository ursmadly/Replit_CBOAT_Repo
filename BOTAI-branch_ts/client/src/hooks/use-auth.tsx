import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  useQuery, 
  useMutation, 
  UseQueryResult,
  UseMutationResult
} from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type User = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: string;
  avatar?: string;
  studyAccess?: string[];
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  // Fetch current user
  const { 
    data, 
    isLoading, 
    error,
    refetch 
  }: UseQueryResult<{ user: User } | undefined, Error> = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated is an expected state
          return { user: null };
        }
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    retry: false
  });

  // Login mutation
  const loginMutation: UseMutationResult<
    { user: User; message: string },
    Error,
    { username: string; password: string }
  > = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Login failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.fullName}!`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid username or password",
      });
    },
  });

  // Logout mutation
  const logoutMutation: UseMutationResult<
    { message: string },
    Error,
    void
  > = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Logout error response:", errorText);
          throw new Error(errorText || "Logout failed");
        }

        return response.json();
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      queryClient.clear();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message,
      });
    },
  });

  // Set user when data changes
  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
    }
  }, [data]);

  // Login function
  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      const result = await loginMutation.mutateAsync({ username, password });
      return result.user;
    } catch (error) {
      return null;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed, clearing user data client-side anyway:", error);
      
      // Even if server-side logout fails, clear user data on the client
      setUser(null);
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      
      // Redirect to login page
      window.location.href = "/auth";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
        error: error || loginMutation.error || logoutMutation.error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}