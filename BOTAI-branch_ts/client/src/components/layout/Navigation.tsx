import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  isSpecial?: boolean;
}

export default function Navigation() {
  const [location] = useLocation();
  const [iconPulse, setIconPulse] = useState(false);

  // Create a pulsing effect for the AI Agents icon
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setIconPulse(prev => !prev);
    }, 1500);
    
    return () => clearInterval(pulseInterval);
  }, []);

  // Ensure all menu items are at the same hierarchical level
  const navigation: NavigationItem[] = [
    { name: "AI Agents", href: "/ai-agents", icon: "psychology", isSpecial: true },
    { name: "Dashboard", href: "/", icon: "dashboard" },
    // { name: "Protofast.AI", href: "/protocol-digitization-ai", icon: "description" }, // Hidden but implementation preserved
    { name: "Study Management", href: "/study-management", icon: "science" },
    { name: "Data Integration", href: "/data-integration", icon: "cloud_sync" },
    { name: "Trial Data Management", href: "/trial-data-management", icon: "description" },
    { name: "Data Manager.AI", href: "/data-manager-ai", icon: "integration_instructions" },
    { name: "Central Monitor.AI", href: "/central-monitor-ai", icon: "smart_toy" },
    // { name: "CSR.AI", href: "/csr-ai", icon: "feed" }, // Hidden but implementation preserved
    { name: "Signal Detection", href: "/signal-detection", icon: "crisis_alert" },
    { name: "Tasks Management", href: "/tasks", icon: "task_alt" },
    { name: "Profile Management", href: "/risk-profiles", icon: "shield" },
    { name: "Reporting and Analytics", href: "/analytics", icon: "analytics" },
    { name: "Notifications", href: "/notifications", icon: "notifications" },
    { name: "Admin", href: "/admin", icon: "admin_panel_settings" },
  ];

  return (
    <nav className="bg-blue-700 w-64 h-full flex flex-col shadow-md">
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-2">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
              
            // Special styling for AI Agents menu item
            if (item.isSpecial && !isActive) {
              return (
                <li key={item.name} className="mb-3 mt-1">
                  <Link href={item.href}>
                    <div className="relative">
                      {/* Glow effect background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-500 rounded-lg blur opacity-70"></div>
                      
                      {/* Main button with gradient */}
                      <div className="relative flex items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg border border-blue-400">
                        <span className={cn(
                          "material-icons mr-3 text-2xl flex-shrink-0 text-cyan-300",
                          iconPulse ? "animate-pulse" : ""
                        )}>
                          {item.icon}
                        </span>
                        <span className="truncate flex items-center font-bold">
                          {item.name}
                          <span className="ml-2 text-xs bg-white text-blue-700 px-1 rounded font-bold">AI HUB</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            }
            
            // Regular menu items
            return (
              <li key={item.name} className="mb-1">
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-all duration-200",
                      isActive
                        ? "bg-white text-blue-800 shadow-sm"
                        : "text-white hover:bg-blue-600 hover:text-white"
                    )}
                  >
                    <span className={cn(
                      "material-icons mr-3 text-2xl flex-shrink-0",
                      isActive ? "text-blue-600" : "text-blue-200"
                    )}>
                      {item.icon}
                    </span>
                    <span className="truncate">
                      {item.name}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}