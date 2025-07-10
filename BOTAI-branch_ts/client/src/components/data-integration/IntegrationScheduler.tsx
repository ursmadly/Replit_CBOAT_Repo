import React, { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CalendarClock,
  Clock,
  Play,
  Pause,
  Trash2,
  Edit,
  Plus,
  Info,
  Calendar as CalendarIcon,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  XCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Schedule {
  id: number;
  sourceId: number;
  sourceName: string;
  scheduleType: "daily" | "weekly" | "monthly" | "custom" | "hourly";
  time?: string;
  days?: number[];
  date?: number;
  lastRun?: string;
  nextRun: string;
  status: "active" | "paused" | "error" | "completed";
  repeatEvery?: number;
  repeatUnit?: "minutes" | "hours";
  enabled: boolean;
}

interface IntegrationSchedulerProps {
  studyId?: number;
  sources: Array<{
    id: number;
    name: string;
    type: string;
    vendor: string;
    frequency: string;
    status: string;
  }>;
}

const daysOfWeek = [
  { id: 0, name: "Sunday" },
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

export default function IntegrationScheduler({ studyId, sources }: IntegrationSchedulerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: 1,
      sourceId: 1,
      sourceName: "EDC Data Feed",
      scheduleType: "daily",
      time: "02:00",
      nextRun: "2025-04-08 02:00:00",
      lastRun: "2025-04-07 02:00:15",
      status: "active",
      enabled: true,
    },
    {
      id: 2,
      sourceId: 2,
      sourceName: "Central Lab Results",
      scheduleType: "custom",
      repeatEvery: 12,
      repeatUnit: "hours",
      nextRun: "2025-04-07 14:00:00",
      lastRun: "2025-04-07 02:00:03",
      status: "active",
      enabled: true,
    },
    {
      id: 3,
      sourceId: 3,
      sourceName: "Imaging Data",
      scheduleType: "weekly",
      days: [1], // Monday
      time: "08:30",
      nextRun: "2025-04-14 08:30:00",
      lastRun: "2025-04-07 08:30:22",
      status: "paused",
      enabled: false,
    },
    {
      id: 4,
      sourceId: 4,
      sourceName: "ECG Data",
      scheduleType: "daily",
      time: "04:00",
      nextRun: "2025-04-08 04:00:00",
      lastRun: "2025-04-07 04:12:55",
      status: "active",
      enabled: true,
    },
    {
      id: 5,
      sourceId: 5,
      sourceName: "CTMS Data",
      scheduleType: "daily",
      time: "06:00",
      nextRun: "2025-04-08 06:00:00",
      lastRun: "2025-04-07 06:00:05",
      status: "error",
      enabled: true,
    },
  ]);

  const [showAddScheduleDialog, setShowAddScheduleDialog] = useState(false);
  const [showEditScheduleDialog, setShowEditScheduleDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    scheduleType: "daily",
    time: "00:00",
    enabled: true,
    status: "active",
  });
  
  const { toast } = useToast();

  // Filter out sources that already have schedules
  const availableSources = sources.filter(
    source => !schedules.some(schedule => schedule.sourceId === source.id)
  );

  const handleAddSchedule = () => {
    if (!newSchedule.sourceId) {
      toast({
        title: "Error",
        description: "Please select a data source",
        variant: "destructive",
      });
      return;
    }

    const source = sources.find(s => s.id === newSchedule.sourceId);
    if (!source) return;

    // Calculate next run time based on schedule type
    let nextRun = new Date();
    
    if (newSchedule.scheduleType === "daily" && newSchedule.time) {
      // Set to tomorrow at the specified time
      nextRun.setDate(nextRun.getDate() + 1);
      const [hours, minutes] = newSchedule.time.split(":").map(Number);
      nextRun.setHours(hours, minutes, 0, 0);
    } else if (newSchedule.scheduleType === "weekly" && newSchedule.days && newSchedule.days.length > 0 && newSchedule.time) {
      // Find the next occurrence of the specified day
      const today = nextRun.getDay();
      const [hours, minutes] = newSchedule.time.split(":").map(Number);
      
      // Sort days to find the next one from today
      const sortedDays = [...newSchedule.days].sort((a, b) => a - b);
      
      // Find the next day that is >= today
      const nextDay = sortedDays.find(day => day >= today) ?? sortedDays[0];
      
      // Calculate days to add
      const daysToAdd = nextDay >= today ? nextDay - today : 7 - today + nextDay;
      
      nextRun.setDate(nextRun.getDate() + daysToAdd);
      nextRun.setHours(hours, minutes, 0, 0);
    } else if (newSchedule.scheduleType === "custom" && newSchedule.repeatEvery && newSchedule.repeatUnit) {
      // Add the repeat interval to the current time
      if (newSchedule.repeatUnit === "hours") {
        nextRun.setHours(nextRun.getHours() + newSchedule.repeatEvery);
      } else if (newSchedule.repeatUnit === "minutes") {
        nextRun.setMinutes(nextRun.getMinutes() + newSchedule.repeatEvery);
      }
    }

    const nextRunStr = format(nextRun, "yyyy-MM-dd HH:mm:ss");

    const newScheduleEntry: Schedule = {
      id: Math.max(...schedules.map(s => s.id), 0) + 1,
      sourceId: newSchedule.sourceId,
      sourceName: source.name,
      scheduleType: newSchedule.scheduleType as "daily" | "weekly" | "monthly" | "custom" | "hourly",
      time: newSchedule.time,
      days: newSchedule.days,
      date: newSchedule.date,
      repeatEvery: newSchedule.repeatEvery,
      repeatUnit: newSchedule.repeatUnit,
      nextRun: nextRunStr,
      status: "active",
      enabled: true,
    };

    setSchedules([...schedules, newScheduleEntry]);
    setShowAddScheduleDialog(false);
    
    // Reset form
    setNewSchedule({
      scheduleType: "daily",
      time: "00:00",
      enabled: true,
      status: "active",
    });

    toast({
      title: "Schedule created",
      description: `${source.name} has been scheduled successfully.`,
    });
  };

  const handleDeleteSchedule = (id: number) => {
    setSchedules(schedules.filter(schedule => schedule.id !== id));
    toast({
      title: "Schedule deleted",
      description: "The integration schedule has been removed.",
    });
  };

  const handleToggleSchedule = (id: number) => {
    setSchedules(schedules.map(schedule => 
      schedule.id === id 
        ? { 
            ...schedule, 
            enabled: !schedule.enabled,
            status: !schedule.enabled ? "active" : "paused"
          } 
        : schedule
    ));
    
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      toast({
        title: schedule.enabled ? "Schedule paused" : "Schedule activated",
        description: `${schedule.sourceName} integration is now ${schedule.enabled ? "paused" : "active"}.`,
      });
    }
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setNewSchedule({
      sourceId: schedule.sourceId,
      sourceName: schedule.sourceName,
      scheduleType: schedule.scheduleType,
      time: schedule.time,
      days: schedule.days,
      date: schedule.date,
      repeatEvery: schedule.repeatEvery,
      repeatUnit: schedule.repeatUnit,
      enabled: schedule.enabled,
      status: schedule.status,
    });
    setShowEditScheduleDialog(true);
  };

  const updateSchedule = () => {
    if (!selectedSchedule) return;

    // Calculate new next run time based on updated schedule
    let nextRun = new Date();
    
    if (newSchedule.scheduleType === "daily" && newSchedule.time) {
      // Set to tomorrow at the specified time
      nextRun.setDate(nextRun.getDate() + 1);
      const [hours, minutes] = newSchedule.time.split(":").map(Number);
      nextRun.setHours(hours, minutes, 0, 0);
    } else if (newSchedule.scheduleType === "weekly" && newSchedule.days && newSchedule.days.length > 0 && newSchedule.time) {
      // Find the next occurrence of the specified day
      const today = nextRun.getDay();
      const [hours, minutes] = newSchedule.time.split(":").map(Number);
      
      // Sort days to find the next one from today
      const sortedDays = [...newSchedule.days].sort((a, b) => a - b);
      
      // Find the next day that is >= today
      const nextDay = sortedDays.find(day => day >= today) ?? sortedDays[0];
      
      // Calculate days to add
      const daysToAdd = nextDay >= today ? nextDay - today : 7 - today + nextDay;
      
      nextRun.setDate(nextRun.getDate() + daysToAdd);
      nextRun.setHours(hours, minutes, 0, 0);
    } else if (newSchedule.scheduleType === "custom" && newSchedule.repeatEvery && newSchedule.repeatUnit) {
      // Add the repeat interval to the current time
      if (newSchedule.repeatUnit === "hours") {
        nextRun.setHours(nextRun.getHours() + newSchedule.repeatEvery);
      } else if (newSchedule.repeatUnit === "minutes") {
        nextRun.setMinutes(nextRun.getMinutes() + newSchedule.repeatEvery);
      }
    }

    const nextRunStr = format(nextRun, "yyyy-MM-dd HH:mm:ss");

    setSchedules(schedules.map(schedule => 
      schedule.id === selectedSchedule.id 
        ? { 
            ...schedule,
            scheduleType: newSchedule.scheduleType as "daily" | "weekly" | "monthly" | "custom" | "hourly",
            time: newSchedule.time,
            days: newSchedule.days,
            date: newSchedule.date,
            repeatEvery: newSchedule.repeatEvery,
            repeatUnit: newSchedule.repeatUnit,
            nextRun: nextRunStr,
            enabled: newSchedule.enabled || false,
            status: newSchedule.enabled ? "active" : "paused",
          } 
        : schedule
    ));
    
    setShowEditScheduleDialog(false);
    
    toast({
      title: "Schedule updated",
      description: `${selectedSchedule.sourceName} schedule has been updated.`,
    });
  };

  const runNow = (id: number) => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;

    toast({
      title: "Integration started",
      description: `Manually running ${schedule.sourceName} integration now.`,
    });

    // Update last run time
    const now = new Date();
    const lastRunStr = format(now, "yyyy-MM-dd HH:mm:ss");

    // Calculate next run based on schedule
    let nextRun = new Date();
    
    if (schedule.scheduleType === "daily" && schedule.time) {
      // Set to tomorrow at the specified time
      nextRun.setDate(nextRun.getDate() + 1);
      const [hours, minutes] = schedule.time.split(":").map(Number);
      nextRun.setHours(hours, minutes, 0, 0);
    } else if (schedule.scheduleType === "weekly" && schedule.days && schedule.days.length > 0 && schedule.time) {
      // Find the next occurrence of the specified day
      const today = nextRun.getDay();
      const [hours, minutes] = schedule.time.split(":").map(Number);
      
      // Sort days to find the next one from today
      const sortedDays = [...schedule.days].sort((a, b) => a - b);
      
      // Find the next day that is >= today
      const nextDay = sortedDays.find(day => day >= today) ?? sortedDays[0];
      
      // Calculate days to add
      const daysToAdd = nextDay >= today ? nextDay - today : 7 - today + nextDay;
      
      nextRun.setDate(nextRun.getDate() + daysToAdd);
      nextRun.setHours(hours, minutes, 0, 0);
    } else if (schedule.scheduleType === "custom" && schedule.repeatEvery && schedule.repeatUnit) {
      // Add the repeat interval to the current time
      if (schedule.repeatUnit === "hours") {
        nextRun.setHours(nextRun.getHours() + schedule.repeatEvery);
      } else if (schedule.repeatUnit === "minutes") {
        nextRun.setMinutes(nextRun.getMinutes() + schedule.repeatEvery);
      }
    }

    const nextRunStr = format(nextRun, "yyyy-MM-dd HH:mm:ss");

    setSchedules(schedules.map(s => 
      s.id === id 
        ? { ...s, lastRun: lastRunStr, nextRun: nextRunStr } 
        : s
    ));
  };

  const getScheduleDescription = (schedule: Schedule) => {
    switch (schedule.scheduleType) {
      case "daily":
        return `Daily at ${schedule.time}`;
      case "weekly":
        if (schedule.days && schedule.days.length > 0) {
          const dayNames = schedule.days.map(day => {
            const dayObj = daysOfWeek.find(d => d.id === day);
            return dayObj ? dayObj.name : "";
          }).join(", ");
          return `Weekly on ${dayNames} at ${schedule.time}`;
        }
        return "Weekly";
      case "monthly":
        return `Monthly on day ${schedule.date} at ${schedule.time}`;
      case "custom":
        return `Every ${schedule.repeatEvery} ${schedule.repeatUnit}`;
      case "hourly":
        return "Every hour";
      default:
        return "Unknown schedule";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case "paused":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Paused</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-blue-600" />
          <CardTitle>Integration Scheduler</CardTitle>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => setShowAddScheduleDialog(true)}
          disabled={availableSources.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data Source</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No schedules configured
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {schedule.sourceName}
                    </TableCell>
                    <TableCell>{getScheduleDescription(schedule)}</TableCell>
                    <TableCell>
                      {schedule.lastRun ? (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-gray-500 mr-1" />
                          {schedule.lastRun.substring(0, 16)}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Never run</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 text-blue-500 mr-1" />
                        {schedule.nextRun.substring(0, 16)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => runNow(schedule.id)}
                          disabled={!schedule.enabled}
                          title="Run now"
                        >
                          <RefreshCw className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleToggleSchedule(schedule.id)}
                          title={schedule.enabled ? "Pause" : "Activate"}
                        >
                          {schedule.enabled ? (
                            <Pause className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Play className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditSchedule(schedule)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add Schedule Dialog */}
        <Dialog open={showAddScheduleDialog} onOpenChange={setShowAddScheduleDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Integration Schedule</DialogTitle>
              <DialogDescription>
                Configure when and how often to run data integration.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="source">Data Source</Label>
                <Select 
                  value={newSchedule.sourceId?.toString() || ""} 
                  onValueChange={(value) => setNewSchedule({...newSchedule, sourceId: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSources.map((source) => (
                      <SelectItem key={source.id} value={source.id.toString()}>
                        {source.name} ({source.vendor})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="scheduleType">Schedule Type</Label>
                <Select 
                  value={newSchedule.scheduleType || "daily"} 
                  onValueChange={(value) => setNewSchedule({...newSchedule, scheduleType: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Daily Schedule Options */}
              {newSchedule.scheduleType === "daily" && (
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={newSchedule.time || "00:00"} 
                    onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                  />
                </div>
              )}
              
              {/* Weekly Schedule Options */}
              {newSchedule.scheduleType === "weekly" && (
                <>
                  <div className="space-y-2">
                    <Label>Days of Week</Label>
                    <div className="grid grid-cols-4 gap-3 mt-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`day-${day.id}`}
                            checked={newSchedule.days?.includes(day.id)}
                            onCheckedChange={(checked) => {
                              const days = newSchedule.days || [];
                              if (checked) {
                                setNewSchedule({...newSchedule, days: [...days, day.id]});
                              } else {
                                setNewSchedule({...newSchedule, days: days.filter(d => d !== day.id)});
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`day-${day.id}`}
                            className="font-normal text-sm"
                          >
                            {day.name.substring(0, 3)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={newSchedule.time || "00:00"} 
                      onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                    />
                  </div>
                </>
              )}
              
              {/* Monthly Schedule Options */}
              {newSchedule.scheduleType === "monthly" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="date">Day of Month</Label>
                    <Select 
                      value={newSchedule.date?.toString() || "1"} 
                      onValueChange={(value) => setNewSchedule({...newSchedule, date: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 31}, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={newSchedule.time || "00:00"} 
                      onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                    />
                  </div>
                </>
              )}
              
              {/* Custom Schedule Options */}
              {newSchedule.scheduleType === "custom" && (
                <div className="flex items-center gap-2">
                  <div className="w-1/3">
                    <Label htmlFor="repeatEvery">Repeat Every</Label>
                    <Input 
                      id="repeatEvery" 
                      type="number" 
                      min="1"
                      value={newSchedule.repeatEvery || 1} 
                      onChange={(e) => setNewSchedule({...newSchedule, repeatEvery: parseInt(e.target.value)})}
                    />
                  </div>
                  
                  <div className="w-2/3">
                    <Label htmlFor="repeatUnit">Unit</Label>
                    <Select 
                      value={newSchedule.repeatUnit || "hours"} 
                      onValueChange={(value) => setNewSchedule({...newSchedule, repeatUnit: value as "minutes" | "hours"})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddScheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSchedule}>
                Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Schedule Dialog */}
        <Dialog open={showEditScheduleDialog} onOpenChange={setShowEditScheduleDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Integration Schedule</DialogTitle>
              <DialogDescription>
                Update schedule settings for {selectedSchedule?.sourceName}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleType">Schedule Type</Label>
                <Select 
                  value={newSchedule.scheduleType || "daily"} 
                  onValueChange={(value) => setNewSchedule({...newSchedule, scheduleType: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Daily Schedule Options */}
              {newSchedule.scheduleType === "daily" && (
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={newSchedule.time || "00:00"} 
                    onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                  />
                </div>
              )}
              
              {/* Weekly Schedule Options */}
              {newSchedule.scheduleType === "weekly" && (
                <>
                  <div className="space-y-2">
                    <Label>Days of Week</Label>
                    <div className="grid grid-cols-4 gap-3 mt-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`edit-day-${day.id}`}
                            checked={newSchedule.days?.includes(day.id)}
                            onCheckedChange={(checked) => {
                              const days = newSchedule.days || [];
                              if (checked) {
                                setNewSchedule({...newSchedule, days: [...days, day.id]});
                              } else {
                                setNewSchedule({...newSchedule, days: days.filter(d => d !== day.id)});
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`edit-day-${day.id}`}
                            className="font-normal text-sm"
                          >
                            {day.name.substring(0, 3)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={newSchedule.time || "00:00"} 
                      onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                    />
                  </div>
                </>
              )}
              
              {/* Monthly Schedule Options */}
              {newSchedule.scheduleType === "monthly" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="date">Day of Month</Label>
                    <Select 
                      value={newSchedule.date?.toString() || "1"} 
                      onValueChange={(value) => setNewSchedule({...newSchedule, date: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 31}, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={newSchedule.time || "00:00"} 
                      onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                    />
                  </div>
                </>
              )}
              
              {/* Custom Schedule Options */}
              {newSchedule.scheduleType === "custom" && (
                <div className="flex items-center gap-2">
                  <div className="w-1/3">
                    <Label htmlFor="repeatEvery">Repeat Every</Label>
                    <Input 
                      id="repeatEvery" 
                      type="number" 
                      min="1"
                      value={newSchedule.repeatEvery || 1} 
                      onChange={(e) => setNewSchedule({...newSchedule, repeatEvery: parseInt(e.target.value)})}
                    />
                  </div>
                  
                  <div className="w-2/3">
                    <Label htmlFor="repeatUnit">Unit</Label>
                    <Select 
                      value={newSchedule.repeatUnit || "hours"} 
                      onValueChange={(value) => setNewSchedule({...newSchedule, repeatUnit: value as "minutes" | "hours"})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="enabled" 
                  checked={newSchedule.enabled} 
                  onCheckedChange={(checked) => setNewSchedule({...newSchedule, enabled: checked})}
                />
                <Label htmlFor="enabled">Schedule Enabled</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditScheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={updateSchedule}>
                Update Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}