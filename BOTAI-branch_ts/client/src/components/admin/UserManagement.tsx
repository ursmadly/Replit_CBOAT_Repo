import { useState } from 'react';
import { 
  UsersIcon, 
  UserPlus, 
  UserMinus, 
  UserCog, 
  Shield, 
  Search, 
  Filter, 
  MoreHorizontal,
  Mail,
  Phone
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock users data
const mockUsers = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@example.com",
    role: "Admin",
    department: "Clinical Operations",
    status: "Active",
    lastActive: "2023-11-30T14:30:00",
    avatarUrl: "",
    phone: "+1 234-567-8901",
    title: "Clinical Research Director",
    permissions: ["manage_users", "manage_trials", "manage_settings", "approve_data"],
    mfaEnabled: true,
    joinDate: "2022-03-15"
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "michael.chen@example.com",
    role: "Data Manager",
    department: "Data Management",
    status: "Active",
    lastActive: "2023-11-30T12:45:00",
    avatarUrl: "",
    phone: "+1 345-678-9012",
    title: "Senior Data Manager",
    permissions: ["view_data", "edit_data", "export_data"],
    mfaEnabled: true,
    joinDate: "2022-05-20"
  },
  {
    id: 3,
    name: "Dr. Robert Garcia",
    email: "robert.garcia@example.com",
    role: "Medical Monitor",
    department: "Medical Affairs",
    status: "Active",
    lastActive: "2023-11-29T16:20:00",
    avatarUrl: "",
    phone: "+1 456-789-0123",
    title: "Principal Medical Monitor",
    permissions: ["view_patients", "view_safety", "add_signals"],
    mfaEnabled: false,
    joinDate: "2022-06-10"
  },
  {
    id: 4,
    name: "Emily Wilson",
    email: "emily.wilson@example.com",
    role: "CRA",
    department: "Clinical Operations",
    status: "Inactive",
    lastActive: "2023-11-15T09:10:00",
    avatarUrl: "",
    phone: "+1 567-890-1234",
    title: "Clinical Research Associate",
    permissions: ["view_sites", "edit_sites", "add_tasks"],
    mfaEnabled: false,
    joinDate: "2022-07-01"
  },
  {
    id: 5,
    name: "James Smith",
    email: "james.smith@example.com",
    role: "Data Manager",
    department: "Data Management",
    status: "Active",
    lastActive: "2023-11-30T11:05:00",
    avatarUrl: "",
    phone: "+1 678-901-2345",
    title: "Data Manager",
    permissions: ["view_data", "edit_data"],
    mfaEnabled: true,
    joinDate: "2022-08-15"
  },
  {
    id: 6,
    name: "Alice Robinson",
    email: "alice.robinson@example.com",
    role: "Admin",
    department: "IT",
    status: "Active",
    lastActive: "2023-11-30T10:30:00",
    avatarUrl: "",
    phone: "+1 789-012-3456",
    title: "IT Systems Administrator",
    permissions: ["manage_users", "manage_settings", "system_config"],
    mfaEnabled: true,
    joinDate: "2022-09-05"
  },
  {
    id: 7,
    name: "David Kim",
    email: "david.kim@example.com",
    role: "Investigator",
    department: "Clinical",
    status: "Active",
    lastActive: "2023-11-28T14:15:00",
    avatarUrl: "",
    phone: "+1 890-123-4567",
    title: "Principal Investigator",
    permissions: ["view_patients", "add_data", "view_sites"],
    mfaEnabled: false,
    joinDate: "2022-10-10"
  }
];

// Mock teams data
const mockTeams = [
  {
    id: 1,
    name: "Clinical Operations",
    description: "Manages clinical trial operations and site management",
    members: 12,
    lead: "Dr. Sarah Johnson"
  },
  {
    id: 2,
    name: "Data Management",
    description: "Handles data collection, cleaning, and analysis",
    members: 8,
    lead: "Michael Chen"
  },
  {
    id: 3,
    name: "Medical Monitoring",
    description: "Responsible for medical oversight and safety monitoring",
    members: 6,
    lead: "Dr. Robert Garcia"
  },
  {
    id: 4,
    name: "Regulatory Affairs",
    description: "Manages regulatory submissions and compliance",
    members: 5,
    lead: "Patricia Williams"
  }
];

// Mock roles data
const mockRoles = [
  {
    id: 1,
    name: "Admin",
    description: "Full system access with user management capabilities",
    users: 2,
    permissions: ["manage_users", "manage_trials", "manage_settings", "approve_data", "system_config"]
  },
  {
    id: 2,
    name: "Data Manager",
    description: "Access to manage and analyze trial data",
    users: 2,
    permissions: ["view_data", "edit_data", "export_data"]
  },
  {
    id: 3,
    name: "Medical Monitor",
    description: "Oversight of medical aspects and safety data",
    users: 1,
    permissions: ["view_patients", "view_safety", "add_signals"]
  },
  {
    id: 4,
    name: "CRA",
    description: "Site monitoring and data verification",
    users: 1,
    permissions: ["view_sites", "edit_sites", "add_tasks"]
  },
  {
    id: 5,
    name: "Investigator",
    description: "Clinical trial implementation at sites",
    users: 1,
    permissions: ["view_patients", "add_data", "view_sites"]
  }
];

interface UserFormData {
  name: string;
  email: string;
  role: string;
  department: string;
  title: string;
  phone: string;
  status: string;
}

function UserForm({ initialData, onSubmit, onCancel }: { initialData?: UserFormData, onSubmit: (data: UserFormData) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState<UserFormData>(initialData || {
    name: "",
    email: "",
    role: "",
    department: "",
    title: "",
    phone: "",
    status: "Active"
  });

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            value={formData.name} 
            onChange={(e) => handleChange("name", e.target.value)} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={formData.email} 
            onChange={(e) => handleChange("email", e.target.value)} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select 
            value={formData.role} 
            onValueChange={(value) => handleChange("role", value)}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Data Manager">Data Manager</SelectItem>
              <SelectItem value="Medical Monitor">Medical Monitor</SelectItem>
              <SelectItem value="CRA">CRA</SelectItem>
              <SelectItem value="Investigator">Investigator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select 
            value={formData.department} 
            onValueChange={(value) => handleChange("department", value)}
          >
            <SelectTrigger id="department">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Clinical Operations">Clinical Operations</SelectItem>
              <SelectItem value="Data Management">Data Management</SelectItem>
              <SelectItem value="Medical Affairs">Medical Affairs</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Regulatory Affairs">Regulatory Affairs</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="title">Job Title</Label>
          <Input 
            id="title" 
            value={formData.title} 
            onChange={(e) => handleChange("title", e.target.value)} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            id="phone" 
            value={formData.phone} 
            onChange={(e) => handleChange("phone", e.target.value)} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleChange("status", value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  );
}

function UserDetails({ user, onClose }: { user: any, onClose: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback>{user.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-bold">{user.name}</h3>
          <p className="text-gray-500">{user.title}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Email</p>
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2 text-gray-400" />
            <p>{user.email}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Phone</p>
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <p>{user.phone}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Department</p>
          <p>{user.department}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Role</p>
          <Badge variant="outline">{user.role}</Badge>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Status</p>
          <Badge 
            variant={user.status === 'Active' ? 'default' : 'secondary'}
          >
            {user.status}
          </Badge>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Join Date</p>
          <p>{new Date(user.joinDate).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium">Permissions</h4>
        <div className="flex flex-wrap gap-2">
          {user.permissions.map((permission: string) => (
            <Badge key={permission} variant="outline">
              {permission.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium">Security</h4>
        <div className="flex items-center space-x-2">
          <Switch id="mfa" checked={user.mfaEnabled} disabled />
          <Label htmlFor="mfa">Multi-factor authentication {user.mfaEnabled ? 'enabled' : 'disabled'}</Label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [teams] = useState(mockTeams);
  const [roles] = useState(mockRoles);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === '' || roleFilter === 'all-roles' || user.role === roleFilter;
    const matchesStatus = statusFilter === '' || statusFilter === 'all-statuses' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get unique roles for filter
  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));
  // Get unique statuses for filter
  const uniqueStatuses = Array.from(new Set(users.map(user => user.status)));

  const handleAddUser = (userData: UserFormData) => {
    const newUser = {
      ...userData,
      id: users.length + 1,
      lastActive: new Date().toISOString(),
      avatarUrl: "",
      permissions: [],
      mfaEnabled: false,
      joinDate: new Date().toISOString().split('T')[0]
    };
    setUsers([...users, newUser]);
    setShowAddUserDialog(false);
  };

  const handleEditUser = (userData: UserFormData) => {
    if (currentUser) {
      const updatedUsers = users.map(user => 
        user.id === currentUser.id ? { ...user, ...userData } : user
      );
      setUsers(updatedUsers);
      setShowEditUserDialog(false);
      setCurrentUser(null);
    }
  };

  const handleDeleteUser = (userId: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (confirmDelete) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  return (
    <div className="space-y-6">
      {/* User Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <UsersIcon className="h-5 w-5 text-primary mr-2" />
              <CardTitle className="text-base">Total Users</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-gray-500">Active: {users.filter(u => u.status === 'Active').length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <UserCog className="h-5 w-5 text-primary mr-2" />
              <CardTitle className="text-base">User Roles</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueRoles.length}</div>
            <p className="text-sm text-gray-500">Most common: {
              uniqueRoles.map(role => ({
                role,
                count: users.filter(u => u.role === role).length
              })).sort((a, b) => b.count - a.count)[0]?.role || 'None'
            }</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-primary mr-2" />
              <CardTitle className="text-base">Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.mfaEnabled).length}</div>
            <p className="text-sm text-gray-500">Users with MFA enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <Tabs defaultValue="users">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            </TabsList>
            
            <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account and assign roles and permissions.
                  </DialogDescription>
                </DialogHeader>
                <UserForm 
                  onSubmit={handleAddUser} 
                  onCancel={() => setShowAddUserDialog(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <TabsContent value="users" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-roles">All Roles</SelectItem>
                    {uniqueRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-statuses">All Statuses</SelectItem>
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Users Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.status === 'Active' ? 'default' : 'secondary'}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(user.lastActive).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setCurrentUser(user);
                                  setShowUserDetailsDialog(true);
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setCurrentUser(user);
                                  setShowEditUserDialog(true);
                                }}
                              >
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        No users found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="teams" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map(team => (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>{team.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Team Lead</p>
                        <p className="font-medium">{team.lead}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Members</p>
                        <p className="font-medium">{team.members}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">View Members</Button>
                    <Button variant="outline" size="sm">Edit Team</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="roles" className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map(role => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>{role.users}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 2).map(perm => (
                            <Badge key={perm} variant="outline">
                              {perm.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                          {role.permissions.length > 2 && (
                            <Badge variant="outline">+{role.permissions.length - 2} more</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          {currentUser && (
            <UserForm 
              initialData={{
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role,
                department: currentUser.department,
                title: currentUser.title,
                phone: currentUser.phone,
                status: currentUser.status
              }}
              onSubmit={handleEditUser} 
              onCancel={() => setShowEditUserDialog(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* User Details Dialog */}
      <Dialog open={showUserDetailsDialog} onOpenChange={setShowUserDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {currentUser && (
            <UserDetails 
              user={currentUser} 
              onClose={() => setShowUserDetailsDialog(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserManagement;