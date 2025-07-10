import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThresholdConfigForm from "@/components/settings/ThresholdConfigForm";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/layout/AppLayout";
import { Trial } from "@shared/schema";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("risk-thresholds");
  const { data: trials = [] } = useQuery<Trial[]>({ 
    queryKey: ['/api/trials'],
    select: (data) => data as Trial[] 
  });
  const selectedTrialId = trials.length > 0 ? trials[0].id : 1;

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        <main className="flex-1 overflow-y-auto p-6 bg-neutral-100">
          {/* Page Title */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">Settings</h1>
              <p className="text-neutral-500 mt-1">Configure the risk management platform</p>
            </div>
          </div>
          
          {/* Settings Tabs */}
          <Card>
            <CardHeader className="border-b border-neutral-200 px-6 py-4">
              <CardTitle className="text-base font-medium text-neutral-800">System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs 
                defaultValue="risk-thresholds" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="p-0 border-b border-blue-200 w-full justify-start rounded-none bg-blue-50">
                  <TabsTrigger 
                    value="risk-thresholds" 
                    className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none px-6 py-3 text-blue-600 data-[state=active]:text-blue-700 hover:bg-blue-100"
                  >
                    Risk Thresholds
                  </TabsTrigger>
                  <TabsTrigger 
                    value="data-sources" 
                    className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none px-6 py-3 text-blue-600 data-[state=active]:text-blue-700 hover:bg-blue-100"
                  >
                    Data Sources
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none px-6 py-3 text-blue-600 data-[state=active]:text-blue-700 hover:bg-blue-100"
                  >
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger 
                    value="roles" 
                    className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none px-6 py-3 text-blue-600 data-[state=active]:text-blue-700 hover:bg-blue-100"
                  >
                    User Roles
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ai-settings" 
                    className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none px-6 py-3 text-blue-600 data-[state=active]:text-blue-700 hover:bg-blue-100"
                  >
                    AI Settings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="risk-thresholds" className="p-6">
                  <ThresholdConfigForm trialId={selectedTrialId} />
                </TabsContent>
                
                <TabsContent value="data-sources" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Data Source Connections</h3>
                      <p className="text-neutral-600 mb-6">
                        Configure connections to clinical trial data sources for risk signal detection.
                      </p>
                      
                      <div className="space-y-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center mr-4">
                                  <span className="material-icons text-blue-600">database</span>
                                </div>
                                <div>
                                  <h4 className="font-medium">EDC System</h4>
                                  <p className="text-sm text-neutral-500">Connected: Medidata Rave</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-green-600">Connected</span>
                                <Button variant="outline" size="sm">Configure</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded bg-purple-100 flex items-center justify-center mr-4">
                                  <span className="material-icons text-purple-600">dvr</span>
                                </div>
                                <div>
                                  <h4 className="font-medium">CTMS</h4>
                                  <p className="text-sm text-neutral-500">Connected: Veeva Vault</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-green-600">Connected</span>
                                <Button variant="outline" size="sm">Configure</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded bg-orange-100 flex items-center justify-center mr-4">
                                  <span className="material-icons text-orange-600">biotech</span>
                                </div>
                                <div>
                                  <h4 className="font-medium">LIMS</h4>
                                  <p className="text-sm text-neutral-500">Not connected</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-neutral-500">Disconnected</span>
                                <Button variant="outline" size="sm">Connect</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded bg-green-100 flex items-center justify-center mr-4">
                                  <span className="material-icons text-green-600">inventory</span>
                                </div>
                                <div>
                                  <h4 className="font-medium">Supply Chain</h4>
                                  <p className="text-sm text-neutral-500">Connected: Clinical Supply System</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-green-600">Connected</span>
                                <Button variant="outline" size="sm">Configure</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Button className="mt-6">
                        <span className="material-icons text-sm mr-1">add</span>
                        Add New Data Source
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="notifications" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
                      <p className="text-neutral-600 mb-6">
                        Configure how and when users receive notifications about risk signals and tasks.
                      </p>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-base font-medium mb-3">Email Notifications</h4>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="critical-risks" className="text-base">Critical Risk Signals</Label>
                                    <p className="text-sm text-neutral-500">Send immediate email for critical risks</p>
                                  </div>
                                  <Switch id="critical-risks" defaultChecked />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="high-risks" className="text-base">High Risk Signals</Label>
                                    <p className="text-sm text-neutral-500">Send immediate email for high risks</p>
                                  </div>
                                  <Switch id="high-risks" defaultChecked />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="medium-risks" className="text-base">Medium Risk Signals</Label>
                                    <p className="text-sm text-neutral-500">Send email for medium risks</p>
                                  </div>
                                  <Switch id="medium-risks" />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="daily-digest" className="text-base">Daily Digest</Label>
                                    <p className="text-sm text-neutral-500">Send daily summary of all new signals</p>
                                  </div>
                                  <Switch id="daily-digest" defaultChecked />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="task-reminders" className="text-base">Task Reminders</Label>
                                    <p className="text-sm text-neutral-500">Send reminders for tasks approaching deadline</p>
                                  </div>
                                  <Switch id="task-reminders" defaultChecked />
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-base font-medium mb-3">In-App Notifications</h4>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="all-risks-app" className="text-base">All Risk Signals</Label>
                                    <p className="text-sm text-neutral-500">Show notifications for all risk signals</p>
                                  </div>
                                  <Switch id="all-risks-app" defaultChecked />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="task-assignments" className="text-base">Task Assignments</Label>
                                    <p className="text-sm text-neutral-500">Notify when tasks are assigned</p>
                                  </div>
                                  <Switch id="task-assignments" defaultChecked />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="task-updates" className="text-base">Task Updates</Label>
                                    <p className="text-sm text-neutral-500">Notify when tasks are updated</p>
                                  </div>
                                  <Switch id="task-updates" defaultChecked />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="roles" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">User Roles & Permissions</h3>
                      <p className="text-neutral-600 mb-6">
                        Configure user roles and their associated permissions in the system.
                      </p>
                      
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-base font-medium">Administrator</CardTitle>
                          </CardHeader>
                          <CardContent className="py-3 px-4 pt-0">
                            <p className="text-sm text-neutral-600 mb-3">Full system access with configuration rights</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">All Pages</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Configuration</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">User Management</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Risk Thresholds</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Data Sources</span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-base font-medium">Study Manager</CardTitle>
                          </CardHeader>
                          <CardContent className="py-3 px-4 pt-0">
                            <p className="text-sm text-neutral-600 mb-3">Can manage tasks, review signals, and access analytics</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Dashboard</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Tasks</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Risk Profiles</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Analytics</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Signal Detection</span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-base font-medium">Data Manager</CardTitle>
                          </CardHeader>
                          <CardContent className="py-3 px-4 pt-0">
                            <p className="text-sm text-neutral-600 mb-3">Can view and address data quality issues</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Dashboard</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Tasks</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Limited Analytics</span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-base font-medium">Clinical Research Associate</CardTitle>
                          </CardHeader>
                          <CardContent className="py-3 px-4 pt-0">
                            <p className="text-sm text-neutral-600 mb-3">Site monitor who can manage site-related tasks</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Dashboard</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Tasks</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Site Risk Profiles</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Button className="mt-6">
                        <span className="material-icons text-sm mr-1">add</span>
                        Create New Role
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="ai-settings" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">AI Detection Settings</h3>
                      <p className="text-neutral-600 mb-6">
                        Configure the AI signal detection system behavior and sensitivity.
                      </p>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-base font-medium mb-3">Detection Schedule</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <Label className="text-sm font-medium mb-1 block">Detection Frequency</Label>
                                  <select className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                                    <option value="hourly">Hourly</option>
                                    <option value="daily" selected>Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="manual">Manual Only</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium mb-1 block">Preferred Time (UTC)</Label>
                                  <select className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                                    <option value="0">00:00</option>
                                    <option value="1">01:00</option>
                                    <option value="2">02:00</option>
                                    <option value="3">03:00</option>
                                    <option value="4">04:00</option>
                                    <option value="5">05:00</option>
                                    <option value="6">06:00</option>
                                    <option value="7">07:00</option>
                                    <option value="8">08:00</option>
                                    <option value="9" selected>09:00</option>
                                    <option value="10">10:00</option>
                                    <option value="11">11:00</option>
                                    <option value="12">12:00</option>
                                    <option value="13">13:00</option>
                                    <option value="14">14:00</option>
                                    <option value="15">15:00</option>
                                    <option value="16">16:00</option>
                                    <option value="17">17:00</option>
                                    <option value="18">18:00</option>
                                    <option value="19">19:00</option>
                                    <option value="20">20:00</option>
                                    <option value="21">21:00</option>
                                    <option value="22">22:00</option>
                                    <option value="23">23:00</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-base font-medium mb-3">Detection Sensitivity</h4>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="auto-create-tasks" className="text-base">Auto-Create Tasks</Label>
                                    <p className="text-sm text-neutral-500">Automatically create tasks from signals</p>
                                  </div>
                                  <Switch id="auto-create-tasks" defaultChecked />
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium mb-1 block">Detection Sensitivity</Label>
                                  <select className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                                    <option value="high">High (More Signals)</option>
                                    <option value="medium" selected>Medium (Balanced)</option>
                                    <option value="low">Low (Only Clear Issues)</option>
                                  </select>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="learning-mode" className="text-base">Learning Mode</Label>
                                    <p className="text-sm text-neutral-500">AI learns from manual classification and feedback</p>
                                  </div>
                                  <Switch id="learning-mode" defaultChecked />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="historical-analysis" className="text-base">Historical Analysis</Label>
                                    <p className="text-sm text-neutral-500">Include historical data in analysis</p>
                                  </div>
                                  <Switch id="historical-analysis" defaultChecked />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppLayout>
  );
}
