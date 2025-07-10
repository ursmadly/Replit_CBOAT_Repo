import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FileText, RefreshCw, FileEdit, ClipboardList } from "lucide-react";

export default function CsrAiContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: agentStatuses, isLoading: loadingStatuses } = useQuery({
    queryKey: ['/api/agent-status'],
    staleTime: 60000, // 1 minute
  });
  
  return (
    <div className="space-y-8">
      {/* Report Architect Header with Document-style Frame */}
      <div className="relative rounded-lg bg-gradient-to-r from-gray-900 to-blue-900 p-6 shadow-lg mb-6">
        <div className="absolute inset-0 bg-black opacity-30 rounded-lg"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Document-style frame with blue glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 opacity-20 animate-pulse rounded-lg"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg border border-blue-300">
                  <FileText className="h-8 w-8 text-white" />
                  {/* Document lines effect */}
                  <div className="absolute top-3 left-3 right-3 h-0.5 bg-blue-200 opacity-60"></div>
                  <div className="absolute top-6 left-3 right-3 h-0.5 bg-blue-200 opacity-60"></div>
                  <div className="absolute top-9 left-3 right-3 h-0.5 bg-blue-200 opacity-60"></div>
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  Report Architect
                  <Badge className="ml-2 bg-blue-500 hover:bg-blue-600">CSR.AI</Badge>
                </h2>
                <p className="text-blue-100">Intelligent clinical study reporting assistant</p>
              </div>
            </div>
            <div>
              <Button 
                size="sm" 
                className="bg-blue-500 hover:bg-blue-600 text-white"
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
            <CardTitle>Clinical Study Report Assistant</CardTitle>
            <CardDescription>
              Generate and manage clinical study reports with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex items-center justify-center h-64">
            <div className="text-center">
              <ClipboardList className="h-12 w-12 text-blue-500 mb-4 mx-auto" />
              <h3 className="text-lg font-medium">CSR.AI enables automated report generation</h3>
              <p className="text-gray-500 mt-2">Use this interface to create and edit clinical study reports</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}