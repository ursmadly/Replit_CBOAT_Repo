import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the user type
export interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  avatar: string | null;
}

// Define the context type
interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  currentDateTime: Date;
}

// Create the context with a default value
const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  isAuthenticated: false,
  currentDateTime: new Date(),
});

// Create a provider component
export function UserProvider({ children }: { children: ReactNode }) {
  // Mock user data - in a real app, this would come from authentication
  const mockUser: User = {
    id: 1,
    fullName: 'John Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    role: 'Clinical Research Associate',
    avatar: null,
  };

  const [currentUser, setCurrentUser] = useState<User | null>(mockUser);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  
  // Update the current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <UserContext.Provider 
      value={{ 
        currentUser, 
        setCurrentUser, 
        isAuthenticated: !!currentUser,
        currentDateTime,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Create a custom hook to use the user context
export function useUser() {
  return useContext(UserContext);
}