import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { useRiskProfiles, useProfilesByType } from "@/lib/hooks/useRisks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Plus, 
  ClipboardCheck, 
  Shield, 
  BadgeAlert, 
  Building2, 
  DollarSign, 
  Users,
  FileBarChart2,
  Filter,
  FileCheck,
  Clock,
  BarChart,
  CircleDollarSign
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ProfileType, EntityType } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Get profile type icon
function getProfileTypeIcon(profileType: string) {
  switch (profileType) {
    case ProfileType.RISK:
      return <BadgeAlert className="h-5 w-5 text-red-500" />;
    case ProfileType.QUALITY:
      return <ClipboardCheck className="h-5 w-5 text-green-500" />;
    case ProfileType.COMPLIANCE:
      return <Shield className="h-5 w-5 text-blue-500" />;
    case ProfileType.SAFETY:
      return <FileCheck className="h-5 w-5 text-amber-500" />;
    case ProfileType.VENDOR:
      return <Building2 className="h-5 w-5 text-purple-500" />;
    case ProfileType.FINANCIAL:
      return <DollarSign className="h-5 w-5 text-emerald-500" />;
    case ProfileType.RESOURCE:
      return <Users className="h-5 w-5 text-indigo-500" />;
    default:
      return <BarChart3 className="h-5 w-5 text-gray-500" />;
  }
}

// Entity type badge
function getEntityBadge(entityType: string) {
  switch (entityType) {
    case EntityType.TRIAL:
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Trial</Badge>;
    case EntityType.SITE:
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Site</Badge>;
    case EntityType.RESOURCE:
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Resource</Badge>;
    case EntityType.VENDOR:
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Vendor</Badge>;
    default:
      return <Badge variant="outline">Other</Badge>;
  }
}

// Risk Score indicator component
function RiskScoreIndicator({ score }: { score: number }) {
  let bgColor = "bg-green-500";
  let textColor = "text-green-700";
  
  if (score >= 75) {
    bgColor = "bg-red-500";
    textColor = "text-red-700";
  } else if (score >= 50) {
    bgColor = "bg-amber-500";
    textColor = "text-amber-700";
  } else if (score >= 25) {
    bgColor = "bg-yellow-500";
    textColor = "text-yellow-700";
  }
  
  return (
    <div className="flex items-center">
      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
        <div className={`h-2.5 rounded-full ${bgColor}`} style={{ width: `${score}%` }}></div>
      </div>
      <span className={`text-sm font-medium ${textColor}`}>{score}</span>
    </div>
  );
}

// Profile detail dialog
function ProfileDetailDialog({ profile }: { profile: any }) {
  const icon = getProfileTypeIcon(profile.profileType);
  const entityBadge = getEntityBadge(profile.entityType);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">View Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {icon}
            <span className="ml-2">{profile.title}</span>
          </DialogTitle>
          <div className="flex items-center space-x-2 mt-1">
            {entityBadge}
            <Badge variant="outline">ID: {profile.entityId}</Badge>
            <Badge variant="outline" className="ml-auto">
              {new Date(profile.assessmentDate).toLocaleDateString()}
            </Badge>
          </div>
          <DialogDescription>
            Comprehensive analysis of {profile.profileType.toLowerCase()} metrics and recommendations
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4 p-1">
            <div>
              <h3 className="text-lg font-medium">Risk Score: {profile.riskScore}</h3>
              <RiskScoreIndicator score={profile.riskScore} />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(profile.metrics).map(([key, value]: [string, any]) => (
                  <div key={key} className="border rounded p-3">
                    <div className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="flex items-center mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${value > 75 ? 'bg-red-500' : value > 50 ? 'bg-amber-500' : value > 25 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {profile.recommendations && profile.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                <ul className="space-y-2 list-disc pl-5">
                  {profile.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline">Export Report</Button>
          <Button>Update Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Profile list table component
function ProfileList({ profileType, entityType, entityId }: { profileType?: string, entityType?: string, entityId?: number }) {
  const { profiles: data = [], isLoading, error } = 
    profileType ? 
      useProfilesByType(profileType) : 
      entityType && entityId ? 
        useRiskProfiles({ entityType, entityId }) : 
        { profiles: [], isLoading: false, error: null };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <BadgeAlert className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Error Loading Profiles</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
          There was an error loading the profiles. Please try again later.
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10">
        <BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Profiles Found</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
          {profileType 
            ? `No ${profileType.toLowerCase()} profiles found.` 
            : entityType && entityId 
              ? `No profiles found for this ${entityType}.`
              : "No profiles found."
          }
        </p>
        <Button className="mt-4" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Profile
        </Button>
      </div>
    );
  }

  // If viewing trials when no entity type/id is specified
  if (!profileType && !entityType && !entityId) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Available Trials</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocol ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((trial: any) => (
              <TableRow key={trial.id}>
                <TableCell className="font-medium">{trial.protocolId}</TableCell>
                <TableCell>{trial.title}</TableCell>
                <TableCell>Phase {trial.phase}</TableCell>
                <TableCell>
                  <Badge className={trial.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                    {trial.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`#${trial.id}`}>View Profiles</a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profile</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Risk Score</TableHead>
            <TableHead>Assessment Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((profile: any) => (
            <TableRow key={profile.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getProfileTypeIcon(profile.profileType)}
                  <span>{profile.title}</span>
                </div>
              </TableCell>
              <TableCell>{getEntityBadge(profile.entityType)}</TableCell>
              <TableCell>{profile.profileType}</TableCell>
              <TableCell>
                <RiskScoreIndicator score={profile.riskScore} />
              </TableCell>
              <TableCell>{new Date(profile.assessmentDate).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <ProfileDetailDialog profile={profile} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Dashboard card component
function DimensionCard({ title, icon, count, changePercent, color }: { 
  title: string, 
  icon: React.ReactNode, 
  count: number,
  changePercent: number,
  color: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{count}</div>
          <div className={`p-2 rounded-full ${color}`}>{icon}</div>
        </div>
        <div className="mt-2 text-xs flex items-center">
          <span className={changePercent >= 0 ? "text-green-600" : "text-red-600"}>
            {changePercent >= 0 ? "↑" : "↓"} {Math.abs(changePercent)}%
          </span>
          <span className="text-muted-foreground ml-1">from previous period</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Benchmark card component
function BenchmarkCard({ title, icon, score, target, color }: {
  title: string,
  icon: React.ReactNode,
  score: number,
  target: number,
  color: string
}) {
  const percentage = Math.round((score / target) * 100);
  
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-full ${color}`}>{icon}</div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-end justify-between mb-2">
          <div className="text-2xl font-bold">{score}</div>
          <div className="text-sm text-muted-foreground">Target: {target}</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${color.replace('bg-opacity-10', '')}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="text-xs text-muted-foreground">
          {percentage}% of target achieved
        </div>
      </CardFooter>
    </Card>
  );
}

export default function RiskProfiles() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profileFilter, setProfileFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Profile Management</h1>
            <p className="text-neutral-500 mt-1">
              Manage risk, quality, compliance, safety, vendor, financial, and resource profiles
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              size="sm"
            >
              <FileBarChart2 className="mr-2 h-4 w-4" />
              Export Reports
            </Button>
            <Button 
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Profile
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-[600px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DimensionCard 
                title="Risk Profiles" 
                icon={<BadgeAlert className="h-5 w-5 text-red-600" />} 
                count={24} 
                changePercent={12} 
                color="bg-red-50 bg-opacity-10"
              />
              <DimensionCard 
                title="Quality Profiles" 
                icon={<ClipboardCheck className="h-5 w-5 text-green-600" />} 
                count={18} 
                changePercent={5} 
                color="bg-green-50 bg-opacity-10"
              />
              <DimensionCard 
                title="Compliance Profiles" 
                icon={<Shield className="h-5 w-5 text-blue-600" />} 
                count={16} 
                changePercent={-3} 
                color="bg-blue-50 bg-opacity-10"
              />
              <DimensionCard 
                title="Safety Profiles" 
                icon={<FileCheck className="h-5 w-5 text-amber-600" />} 
                count={22} 
                changePercent={8} 
                color="bg-amber-50 bg-opacity-10"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                    Profile Distribution by Entity Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-6 w-full">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <span>Trial</span>
                          </div>
                          <span className="font-medium">25%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            <span>Site</span>
                          </div>
                          <span className="font-medium">40%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                            <span>Resource</span>
                          </div>
                          <span className="font-medium">20%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                            <span>Vendor</span>
                          </div>
                          <span className="font-medium">15%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="relative w-40 h-40">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-sm font-medium">80 Profiles</div>
                          </div>
                          {/* SVG pie chart would go here in a real implementation */}
                          <svg width="160" height="160" viewBox="0 0 42 42" className="rotate-[-90deg]">
                            <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e9ecef" strokeWidth="3"></circle>
                            <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="0"></circle>
                            <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#22c55e" strokeWidth="3" strokeDasharray="40 60" strokeDashoffset="-25"></circle>
                            <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#a855f7" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="-65"></circle>
                            <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" strokeWidth="3" strokeDasharray="15 85" strokeDashoffset="-85"></circle>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BadgeAlert className="mr-2 h-5 w-5 text-red-600" />
                    High Risk Entities
                  </CardTitle>
                  <CardDescription>
                    Entities with risk score &gt;75
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Site 123</div>
                          <div className="text-sm text-muted-foreground">New York</div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">86</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">PRO002 Trial</div>
                          <div className="text-sm text-muted-foreground">Phase II</div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">82</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">J. Thompson</div>
                          <div className="text-sm text-muted-foreground">CRA</div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">79</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Site 305</div>
                          <div className="text-sm text-muted-foreground">Houston</div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">77</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">LabCorp</div>
                          <div className="text-sm text-muted-foreground">Vendor</div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">76</Badge>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <BenchmarkCard 
                title="Avg. Cycle Time (days)" 
                icon={<Clock className="h-5 w-5 text-blue-600" />} 
                score={142} 
                target={120} 
                color="bg-blue-50 bg-opacity-10"
              />
              <BenchmarkCard 
                title="Risk Score Reduction" 
                icon={<BarChart className="h-5 w-5 text-green-600" />} 
                score={18} 
                target={25} 
                color="bg-green-50 bg-opacity-10"
              />
              <BenchmarkCard 
                title="Recruitment Rate (%)" 
                icon={<Users className="h-5 w-5 text-indigo-600" />} 
                score={62} 
                target={80} 
                color="bg-indigo-50 bg-opacity-10"
              />
              <BenchmarkCard 
                title="Budget Utilization (%)" 
                icon={<CircleDollarSign className="h-5 w-5 text-emerald-600" />} 
                score={85} 
                target={90} 
                color="bg-emerald-50 bg-opacity-10"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="profiles" className="space-y-6 mt-6">
            <Tabs defaultValue={ProfileType.RISK}>
              <TabsList className="mb-6">
                <TabsTrigger value={ProfileType.RISK}>Risk</TabsTrigger>
                <TabsTrigger value={ProfileType.QUALITY}>Quality</TabsTrigger>
                <TabsTrigger value={ProfileType.COMPLIANCE}>Compliance</TabsTrigger>
                <TabsTrigger value={ProfileType.SAFETY}>Safety</TabsTrigger>
                <TabsTrigger value={ProfileType.VENDOR}>Vendor</TabsTrigger>
                <TabsTrigger value={ProfileType.FINANCIAL}>Financial</TabsTrigger>
                <TabsTrigger value={ProfileType.RESOURCE}>Resource</TabsTrigger>
              </TabsList>
              
              {/* Filtering options for all tabs */}
              <div className="flex flex-wrap items-end gap-4 mb-6">
                <div>
                  <Label htmlFor="entityType">Entity Type</Label>
                  <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger className="w-[200px]" id="entityType">
                      <SelectValue placeholder="All Entity Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entity Types</SelectItem>
                      <SelectItem value={EntityType.TRIAL}>Trial</SelectItem>
                      <SelectItem value={EntityType.SITE}>Site</SelectItem>
                      <SelectItem value={EntityType.RESOURCE}>Resource</SelectItem>
                      <SelectItem value={EntityType.VENDOR}>Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Tab content */}
              
              <TabsContent value={ProfileType.RISK}>
                <ProfileList 
                  profileType={ProfileType.RISK} 
                  entityType={entityFilter === "all" ? undefined : entityFilter}
                  entityId={undefined}
                />
              </TabsContent>
              
              <TabsContent value={ProfileType.QUALITY}>
                <ProfileList 
                  profileType={ProfileType.QUALITY} 
                  entityType={entityFilter === "all" ? undefined : entityFilter}
                  entityId={undefined}
                />
              </TabsContent>
              
              <TabsContent value={ProfileType.COMPLIANCE}>
                <ProfileList 
                  profileType={ProfileType.COMPLIANCE} 
                  entityType={entityFilter === "all" ? undefined : entityFilter}
                  entityId={undefined}
                />
              </TabsContent>
              
              <TabsContent value={ProfileType.SAFETY}>
                <ProfileList 
                  profileType={ProfileType.SAFETY} 
                  entityType={entityFilter === "all" ? undefined : entityFilter}
                  entityId={undefined}
                />
              </TabsContent>
              
              <TabsContent value={ProfileType.VENDOR}>
                <ProfileList 
                  profileType={ProfileType.VENDOR} 
                  entityType={entityFilter === "all" ? undefined : entityFilter}
                  entityId={undefined}
                />
              </TabsContent>
              
              <TabsContent value={ProfileType.FINANCIAL}>
                <ProfileList 
                  profileType={ProfileType.FINANCIAL} 
                  entityType={entityFilter === "all" ? undefined : entityFilter}
                  entityId={undefined}
                />
              </TabsContent>
              
              <TabsContent value={ProfileType.RESOURCE}>
                <ProfileList 
                  profileType={ProfileType.RESOURCE} 
                  entityType={entityFilter === "all" ? undefined : entityFilter}
                  entityId={undefined}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="dimensions" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Dimension</CardTitle>
                  <CardDescription>Manage portfolio level profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-md">
                      <div className="flex items-center">
                        <BadgeAlert className="mr-3 h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Risk</div>
                          <div className="text-sm text-muted-foreground">Portfolio risk assessment</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-md">
                      <div className="flex items-center">
                        <DollarSign className="mr-3 h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="font-medium">Financial</div>
                          <div className="text-sm text-muted-foreground">Portfolio financial health</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Program Dimension</CardTitle>
                  <CardDescription>Manage program level profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-md">
                      <div className="flex items-center">
                        <ClipboardCheck className="mr-3 h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">Quality</div>
                          <div className="text-sm text-muted-foreground">Program quality metrics</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-md">
                      <div className="flex items-center">
                        <Shield className="mr-3 h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Compliance</div>
                          <div className="text-sm text-muted-foreground">Program compliance status</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Site Dimension</CardTitle>
                  <CardDescription>Manage site level profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-md">
                      <div className="flex items-center">
                        <BadgeAlert className="mr-3 h-5 w-5 text-red-600" />
                        <div>
                          <div className="font-medium">Risk</div>
                          <div className="text-sm text-muted-foreground">Site risk assessment</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-md">
                      <div className="flex items-center">
                        <FileCheck className="mr-3 h-5 w-5 text-amber-600" />
                        <div>
                          <div className="font-medium">Safety</div>
                          <div className="text-sm text-muted-foreground">Site safety status</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Resource Dimension</CardTitle>
                  <CardDescription>Manage resource level profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-md">
                      <div className="flex items-center">
                        <Users className="mr-3 h-5 w-5 text-indigo-600" />
                        <div>
                          <div className="font-medium">Resource</div>
                          <div className="text-sm text-muted-foreground">Resource performance</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-md">
                      <div className="flex items-center">
                        <DollarSign className="mr-3 h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="font-medium">Financial</div>
                          <div className="text-sm text-muted-foreground">Resource allocation</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="benchmarks" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Benchmark Metrics</CardTitle>
                <CardDescription>Compare performance against industry benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Industry Avg</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Cycle Times (days)</TableCell>
                      <TableCell>142</TableCell>
                      <TableCell>120</TableCell>
                      <TableCell>135</TableCell>
                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-800">At Risk</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Risk Score Avg</TableCell>
                      <TableCell>42</TableCell>
                      <TableCell>30</TableCell>
                      <TableCell>45</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Good</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Quality Score</TableCell>
                      <TableCell>78</TableCell>
                      <TableCell>85</TableCell>
                      <TableCell>75</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-800">Attention</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Clinical Services Rating</TableCell>
                      <TableCell>8.2/10</TableCell>
                      <TableCell>8.5/10</TableCell>
                      <TableCell>7.9/10</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Good</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Recruitment Rate (%)</TableCell>
                      <TableCell>62%</TableCell>
                      <TableCell>80%</TableCell>
                      <TableCell>65%</TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">Critical</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Performance metrics over time</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p>Performance trend visualization would appear here</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Benchmark Comparison</CardTitle>
                  <CardDescription>Compare to industry standards</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p>Benchmark comparison visualization would appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>
                  Track profile metrics over time to identify patterns and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p>Trend visualization would appear here</p>
                  <p className="text-sm mt-2">This module would show time-series data for selected metrics</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}