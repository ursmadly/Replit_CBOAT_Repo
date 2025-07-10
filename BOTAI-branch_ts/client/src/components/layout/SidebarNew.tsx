import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  FileBarChart,
  Users,
  AlertTriangle,
  CheckSquare,
  BarChart3,
  BellRing,
  ShieldCheck,
  Settings,
  ChevronRight,
  ChevronDown,
  LogOut,
  Badge,
  Sparkles,
  Network,
  Database
} from "lucide-react";

interface NavItem {
  name: string;
  icon: any;
  path: string;
  badge?: number;
  children?: {
    name: string;
    icon: any;
    path: string;
  }[];
}

// Very simplified sidebar with real user data
export default function SidebarNew() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "/admin": true // Keep Admin section expanded by default to show Technical Details
  });

  // Fixed notifications count for demo
  const notificationCount = 2;

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Filter navigation items based on user role
  const baseNavItems = [
    {
      name: "AI Agents",
      icon: Sparkles,
      path: "/ai-agents",
    },
    {
      name: "Dashboard",
      icon: Home,
      path: "/",
    },
    {
      name: "Study Management",
      icon: Users,
      path: "/study-management",
    },
    {
      name: "Trial Data Management",
      icon: FileBarChart,
      path: "/trial-data-management",
    },
    {
      name: "DM Compliance",
      icon: Badge,
      path: "/data-management",
    },
    {
      name: "Signal Detection",
      icon: AlertTriangle,
      path: "/signal-detection",
    },
    {
      name: "Tasks Management",
      icon: CheckSquare,
      path: "/tasks",
    },
    {
      name: "Profile Management",
      icon: FileBarChart,
      path: "/risk-profiles",
    },
    {
      name: "Reporting and Analytics",
      icon: BarChart3,
      path: "/analytics",
    },
    {
      name: "Notifications",
      icon: BellRing,
      path: "/notifications",
      badge: notificationCount,
    },
  ];

  // Add admin section only for System Administrator role
  const navItems: NavItem[] = user?.role === "System Administrator" ? [
    ...baseNavItems,
    {
      name: "Admin",
      icon: ShieldCheck,
      path: "/admin",
      children: [
        {
          name: "Settings",
          icon: Settings,
          path: "/settings",
        },
        {
          name: "Technical Details",
          icon: Network,
          path: "/technical-details",
        }
      ]
    },
  ] : baseNavItems;

  return (
    <aside className="hidden sm:flex flex-col w-64 h-screen bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent leading-relaxed">
          Clinical Business Orchestration and AI Technology Platform
        </h1>
      </div>

      <nav className="flex-1 pt-4 pb-4 px-2 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item, index) => (
            <div key={index} className="space-y-1">
              {'children' in item && item.children ? (
                <>
                  <button
                    onClick={() => setExpandedItems(prev => ({...prev, [item.path]: !prev[item.path]}))}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                      location.startsWith(item.path)
                        ? "bg-primary-50 text-primary font-medium"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5",
                        location.startsWith(item.path)
                          ? "text-primary"
                          : "text-gray-500"
                      )}
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    {expandedItems[item.path] ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </button>
                  
                  {expandedItems[item.path] && 'children' in item && item.children && (
                    <div className="ml-6 space-y-1 mt-1">
                      {item.children.map((child: any, i: number) => (
                        <Link
                          key={i}
                          href={child.path}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                            location === child.path
                              ? "bg-primary-50 text-primary font-medium"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          )}
                        >
                          <child.icon
                            className={cn(
                              "mr-3 h-5 w-5",
                              location === child.path
                                ? "text-primary"
                                : "text-gray-500"
                            )}
                          />
                          <span className="flex-1">{child.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                    item.path === "/ai-agents" 
                      ? "bg-blue-100 text-blue-700 font-medium border border-blue-200" // Special styling for AI Agents
                      : location === item.path
                        ? "bg-primary-50 text-primary font-medium"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      item.path === "/ai-agents"
                        ? "text-blue-600" // Special styling for AI Agents icon
                        : location === item.path
                          ? "text-primary"
                          : "text-gray-500"
                    )}
                  />
                  <span className={cn(
                    "flex-1",
                    item.path === "/ai-agents" && "font-semibold" // Make AI Agents text bold
                  )}>
                    {item.name}
                    {item.path === "/ai-agents" && <span className="ml-1 text-xs bg-blue-600 text-white px-1 rounded">New</span>}
                  </span>
                  {'badge' in item && item.badge && (
                    <span className="ml-auto h-5 min-w-5 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center px-1">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
              {getInitials(user?.fullName || "User")}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{user?.fullName || "User"}</p>
              <p className="text-xs text-gray-500">{user?.role || "Not authenticated"}</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.location.href = '/login'}
            className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}