import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/layout/AppLayout";
import DataIntegrationManager from "@/components/data-integration/DataIntegrationManager";
import IntegrationMonitorAI from "@/components/data-integration/IntegrationMonitorAI";
import IntegrationScheduler from "@/components/data-integration/IntegrationScheduler";
import { Database, Cpu, Activity, Settings, CalendarClock } from "lucide-react";
import { useState } from "react";

export default function DataIntegration() {
  // Sample integration sources
  const [integrationSources] = useState([
    {
      id: 1,
      name: "EDC Data Feed",
      type: "API",
      vendor: "Medidata Rave",
      frequency: "Daily at 2:00 AM",
      status: "active",
    },
    {
      id: 2,
      name: "Central Lab Results",
      type: "SFTP",
      vendor: "Labcorp",
      frequency: "Every 12 hours",
      status: "active",
    },
    {
      id: 3,
      name: "Imaging Data",
      type: "S3",
      vendor: "Calyx",
      frequency: "Weekly on Monday",
      status: "inactive",
    },
    {
      id: 4,
      name: "ECG Data",
      type: "API",
      vendor: "AliveCor",
      frequency: "Daily at 4:00 AM",
      status: "active",
    },
    {
      id: 5,
      name: "CTMS Data",
      type: "API",
      vendor: "Veeva Vault CTMS",
      frequency: "Daily at 6:00 AM",
      status: "error",
    },
    {
      id: 6,
      name: "eCOA Data",
      type: "API",
      vendor: "ClinicalInk",
      frequency: "Every 6 hours",
      status: "configuring",
    },
  ]);

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Integration</h1>
            <p className="text-muted-foreground">
              Manage data integrations and connections across your clinical trials
            </p>
          </div>
        </div>

        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="mb-6 w-full max-w-md">
            <TabsTrigger value="sources" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="scheduler" className="flex items-center">
              <CalendarClock className="h-4 w-4 mr-2" />
              Scheduler
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Real-Time Monitoring
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sources" className="mt-0">
            <DataIntegrationManager />
          </TabsContent>
          
          <TabsContent value="scheduler" className="mt-0 space-y-6">
            <IntegrationScheduler sources={integrationSources} />
          </TabsContent>
          
          <TabsContent value="monitoring" className="mt-0">
            <IntegrationMonitorAI />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}