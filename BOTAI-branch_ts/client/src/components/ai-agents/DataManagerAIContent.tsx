import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataManagerBot } from "@/components/ai-assistants/DataManagerBot";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Database, RefreshCw, Loader2, Zap } from "lucide-react";

export default function DataManagerAIContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: agentStatuses, isLoading: loadingStatuses } = useQuery({
    queryKey: ['/api/agent-status'],
    staleTime: 60000, // 1 minute
  });
  
  return (
    <div className="space-y-8">
      {/* Quantum Analyst Header with Hexagonal Frame */}
      <div className="relative rounded-lg bg-gradient-to-r from-indigo-900 to-blue-900 p-6 shadow-lg mb-6">
        <div className="absolute inset-0 bg-black opacity-30 rounded-lg"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Hexagonal frame with pulsing effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-teal-400 opacity-20 animate-pulse rounded-xl"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg border border-teal-300">
                  <Database className="h-8 w-8 text-white" />
                  {/* Animated particles */}
                  <div className="absolute top-1 right-1 h-1 w-1 bg-teal-200 rounded-full animate-ping"></div>
                  <div className="absolute bottom-2 left-1 h-1 w-1 bg-teal-200 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute top-2 left-2 h-1 w-1 bg-teal-200 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  Quantum Analyst
                  <Badge className="ml-2 bg-teal-500 hover:bg-teal-600">Data Manager.AI</Badge>
                </h2>
                <p className="text-teal-100">Advanced data orchestration and integration engine</p>
              </div>
            </div>
            <div>
              <Button 
                size="sm" 
                className="bg-teal-500 hover:bg-teal-600 text-white"
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
            <CardTitle>Data Manager.AI Assistant</CardTitle>
            <CardDescription>
              Ask questions or give commands to manage your trial data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataManagerBot trialId={null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}