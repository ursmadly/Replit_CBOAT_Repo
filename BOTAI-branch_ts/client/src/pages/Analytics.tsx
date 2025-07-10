import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, Download, BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Reports & Analytics</h1>
            <p className="text-neutral-500 mt-1">Risk trends, performance metrics, and operational insights</p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              size="sm"
            >
              <BarChart className="mr-2 h-4 w-4" />
              View Reports
            </Button>
            <Button 
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <LineChart className="mr-2 h-5 w-5 text-blue-600" />
              Analytics Dashboard
            </CardTitle>
            <CardDescription>
              This module has been cleared for the demo per your request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border-2 border-dashed border-gray-200 p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Analytics Data Cleared</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                All analytics and reporting data has been cleared for the demo. You can use the buttons above to view reports or export data.
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline">View Documentation</Button>
                <Button>Generate Report</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}