import { useUser } from "@/lib/contexts/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Clock } from "lucide-react";
import { format } from "date-fns";

export default function UserInfo() {
  const { currentUser, currentDateTime } = useUser();
  
  if (!currentUser) return null;
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              {currentUser.avatar ? (
                <AvatarImage src={currentUser.avatar} alt={currentUser.fullName} />
              ) : null}
              <AvatarFallback>{getInitials(currentUser.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{currentUser.fullName}</p>
              <p className="text-xs text-neutral-500">{currentUser.role}</p>
            </div>
          </div>
          <div className="flex items-center text-xs text-neutral-500">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              {format(currentDateTime, 'dd MMM yyyy, h:mm a')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}