import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Server, RefreshCw, Shield, EyeIcon } from "lucide-react";

export default function CentralMonitorAIContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: agentStatuses, isLoading: loadingStatuses } = useQuery({
    queryKey: ['/api/agent-status'],
    staleTime: 60000, // 1 minute
  });
  
  return (
    <div className="space-y-8">
      {/* Sentinel Guardian Header with Diamond Frame */}
      <div className="relative rounded-lg bg-gradient-to-r from-gray-900 to-blue-900 p-6 shadow-lg mb-6">
        <div className="absolute inset-0 bg-black opacity-30 rounded-lg"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Diamond frame with scanning effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-red-400 opacity-20 animate-pulse rounded-lg transform rotate-45"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-red-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg border border-red-300 transform rotate-45">
                  <div className="transform -rotate-45">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  {/* Scanning effect */}
                  <div className="absolute left-0 right-0 h-1 bg-red-200 opacity-60 animate-pulse" 
                       style={{ animation: "moveUpDown 3s ease-in-out infinite" }}></div>
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  Sentinel Guardian
                  <Badge className="ml-2 bg-red-500 hover:bg-red-600">Central Monitor.AI</Badge>
                </h2>
                <p className="text-red-100">Advanced trial monitoring and risk detection system</p>
              </div>
            </div>
            <div>
              <Button 
                size="sm" 
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={() => queryClient.invalidateQueries({
                  queryKey: ['/api/agent-status'],
                })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Central Monitoring Dashboard</CardTitle>
            <CardDescription>
              Advanced risk-based monitoring capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex items-center justify-center h-64">
            <div className="text-center">
              <EyeIcon className="h-12 w-12 text-red-500 mb-4 mx-auto" />
              <h3 className="text-lg font-medium">Central Monitor.AI is actively scanning for risks</h3>
              <p className="text-gray-500 mt-2">Use this interface to view trial monitoring metrics and risk insights</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}