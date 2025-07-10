import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  adminOnly?: boolean;
}

export function ProtectedRoute({ path, component: Component, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        // Loading state
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      ) : !user ? (
        // Not authenticated
        <Redirect to="/login" />
      ) : adminOnly && user.role !== "System Administrator" ? (
        // Not authorized (admin only)
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </div>
      ) : (
        // Authenticated and authorized
        <Component />
      )}
    </Route>
  );
}