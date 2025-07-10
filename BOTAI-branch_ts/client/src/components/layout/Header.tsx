import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Settings, User, LogOut, Search, Menu, BellRing } from "lucide-react";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/lib/contexts/UserContext";

export default function Header() {
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser } = useUser();
  
  // Mock notification count
  const notificationCount = 3;
  
  return (
    <header className="border-b border-blue-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon"
              className="mr-2 sm:hidden text-blue-600 hover:bg-blue-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={20} />
            </Button>
          )}
          
          <div className="hidden md:flex items-center mr-4">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Clinical Business Orchestration and AI Technology Platform
            </h1>
          </div>
          
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-500" />
            <Input
              type="search"
              placeholder="Search trials, sites, or tasks..."
              className="pl-8 w-[300px] lg:w-[400px] border-blue-200 focus-visible:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="relative text-blue-600 hover:bg-blue-50"
            onClick={() => navigate("/notifications")}
          >
            <BellRing size={20} />
            {notificationCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500"
                variant="destructive"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-blue-600 hover:bg-blue-50"
            onClick={() => navigate("/settings")}
          >
            <Settings size={20} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full border border-blue-200 hover:bg-blue-50">
                <Avatar className="h-8 w-8">
                  {currentUser?.avatar ? (
                    <AvatarImage src={currentUser.avatar} alt={currentUser.fullName} />
                  ) : null}
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {currentUser?.fullName
                      ? currentUser.fullName
                          .split(' ')
                          .map(part => part[0])
                          .join('')
                          .toUpperCase()
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border border-blue-200">
              <DropdownMenuLabel className="text-blue-700">My Account</DropdownMenuLabel>
              <DropdownMenuItem disabled className="opacity-70">
                {currentUser?.fullName || 'User'} 
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-70 text-xs">
                {currentUser?.role || 'Role'} 
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-blue-100" />
              <DropdownMenuItem className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">
                <User className="mr-2 h-4 w-4 text-blue-600" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")} className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-blue-600" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-blue-100" />
              <DropdownMenuItem className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4 text-blue-600" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}