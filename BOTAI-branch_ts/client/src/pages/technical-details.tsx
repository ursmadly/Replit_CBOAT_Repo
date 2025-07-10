import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Database, Server, Users, Shield, Brain, Workflow, CloudCog } from "lucide-react";

export default function TechnicalDetailsPage() {
  const [activeTab, setActiveTab] = useState("architecture");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Technical Details</h1>
        <p className="text-gray-600">
          Comprehensive technical documentation including system architecture and data models
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="architecture" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Architecture Diagram
          </TabsTrigger>
          <TabsTrigger value="datamodel" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Model Diagram
          </TabsTrigger>
        </TabsList>

        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                System Architecture Overview
              </CardTitle>
              <CardDescription>
                Clinical Agents - AI-Powered Clinical Trial Management Platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-50 rounded-lg p-8 overflow-x-auto">
                <svg viewBox="0 0 1200 800" className="w-full h-auto max-w-none" style={{ minWidth: "1200px" }}>
                  {/* Background */}
                  <rect width="1200" height="800" fill="#f8fafc" />
                  
                  {/* Title */}
                  <text x="600" y="30" textAnchor="middle" className="text-xl font-bold fill-gray-800">
                    Clinical Agents - System Architecture
                  </text>
                  
                  {/* Frontend Layer */}
                  <rect x="50" y="80" width="1100" height="120" fill="#3b82f6" rx="8" opacity="0.1" />
                  <text x="70" y="105" className="text-sm font-semibold fill-blue-800">Frontend Layer</text>
                  
                  {/* React Components */}
                  <rect x="80" y="120" width="200" height="60" fill="#60a5fa" rx="4" />
                  <text x="180" y="145" textAnchor="middle" className="text-sm font-medium fill-white">React.js Frontend</text>
                  <text x="180" y="165" textAnchor="middle" className="text-xs fill-white">TypeScript, Tailwind CSS</text>
                  
                  {/* Real-time Components */}
                  <rect x="300" y="120" width="200" height="60" fill="#60a5fa" rx="4" />
                  <text x="400" y="145" textAnchor="middle" className="text-sm font-medium fill-white">Real-time Dashboard</text>
                  <text x="400" y="165" textAnchor="middle" className="text-xs fill-white">WebSocket, Live Updates</text>
                  
                  {/* Authentication */}
                  <rect x="520" y="120" width="200" height="60" fill="#60a5fa" rx="4" />
                  <text x="620" y="145" textAnchor="middle" className="text-sm font-medium fill-white">Authentication</text>
                  <text x="620" y="165" textAnchor="middle" className="text-xs fill-white">Role-based Access</text>
                  
                  {/* Responsive Design */}
                  <rect x="740" y="120" width="200" height="60" fill="#60a5fa" rx="4" />
                  <text x="840" y="145" textAnchor="middle" className="text-sm font-medium fill-white">Responsive Design</text>
                  <text x="840" y="165" textAnchor="middle" className="text-xs fill-white">Mobile, Tablet, Desktop</text>
                  
                  {/* Notifications */}
                  <rect x="960" y="120" width="160" height="60" fill="#60a5fa" rx="4" />
                  <text x="1040" y="145" textAnchor="middle" className="text-sm font-medium fill-white">Notifications</text>
                  <text x="1040" y="165" textAnchor="middle" className="text-xs fill-white">Real-time Alerts</text>
                  
                  {/* API Gateway Layer */}
                  <rect x="50" y="230" width="1100" height="100" fill="#10b981" rx="8" opacity="0.1" />
                  <text x="70" y="255" className="text-sm font-semibold fill-green-800">API Gateway & Backend Services</text>
                  
                  {/* Express Server */}
                  <rect x="80" y="270" width="180" height="50" fill="#059669" rx="4" />
                  <text x="170" y="290" textAnchor="middle" className="text-sm font-medium fill-white">Express.js Server</text>
                  <text x="170" y="305" textAnchor="middle" className="text-xs fill-white">REST API, Middleware</text>
                  
                  {/* WebSocket Server */}
                  <rect x="280" y="270" width="180" height="50" fill="#059669" rx="4" />
                  <text x="370" y="290" textAnchor="middle" className="text-sm font-medium fill-white">WebSocket Server</text>
                  <text x="370" y="305" textAnchor="middle" className="text-xs fill-white">Real-time Communication</text>
                  
                  {/* Session Management */}
                  <rect x="480" y="270" width="180" height="50" fill="#059669" rx="4" />
                  <text x="570" y="290" textAnchor="middle" className="text-sm font-medium fill-white">Session Management</text>
                  <text x="570" y="305" textAnchor="middle" className="text-xs fill-white">Authentication, Security</text>
                  
                  {/* File Upload */}
                  <rect x="680" y="270" width="180" height="50" fill="#059669" rx="4" />
                  <text x="770" y="290" textAnchor="middle" className="text-sm font-medium fill-white">File Management</text>
                  <text x="770" y="305" textAnchor="middle" className="text-xs fill-white">Upload, Processing</text>
                  
                  {/* API Routes */}
                  <rect x="880" y="270" width="180" height="50" fill="#059669" rx="4" />
                  <text x="970" y="290" textAnchor="middle" className="text-sm font-medium fill-white">API Routes</text>
                  <text x="970" y="305" textAnchor="middle" className="text-xs fill-white">Domain, Tasks, Users</text>
                  
                  {/* AI/ML Layer */}
                  <rect x="50" y="360" width="1100" height="120" fill="#8b5cf6" rx="8" opacity="0.1" />
                  <text x="70" y="385" className="text-sm font-semibold fill-purple-800">AI/ML Processing Layer</text>
                  
                  {/* OpenAI Integration */}
                  <rect x="80" y="400" width="200" height="60" fill="#7c3aed" rx="4" />
                  <text x="180" y="425" textAnchor="middle" className="text-sm font-medium fill-white">OpenAI Integration</text>
                  <text x="180" y="445" textAnchor="middle" className="text-xs fill-white">GPT-4o, Signal Detection</text>
                  
                  {/* Vector Database */}
                  <rect x="300" y="400" width="200" height="60" fill="#7c3aed" rx="4" />
                  <text x="400" y="425" textAnchor="middle" className="text-sm font-medium fill-white">Vector Database</text>
                  <text x="400" y="445" textAnchor="middle" className="text-xs fill-white">Pinecone, RAG</text>
                  
                  {/* AI Agents */}
                  <rect x="520" y="400" width="200" height="60" fill="#7c3aed" rx="4" />
                  <text x="620" y="425" textAnchor="middle" className="text-sm font-medium fill-white">AI Agents</text>
                  <text x="620" y="445" textAnchor="middle" className="text-xs fill-white">Autonomous Monitoring</text>
                  
                  {/* Rule Engine */}
                  <rect x="740" y="400" width="200" height="60" fill="#7c3aed" rx="4" />
                  <text x="840" y="425" textAnchor="middle" className="text-sm font-medium fill-white">Rule Engine</text>
                  <text x="840" y="445" textAnchor="middle" className="text-xs fill-white">Quality Checks, Validation</text>
                  
                  {/* Signal Processing */}
                  <rect x="960" y="400" width="160" height="60" fill="#7c3aed" rx="4" />
                  <text x="1040" y="425" textAnchor="middle" className="text-sm font-medium fill-white">Signal Processing</text>
                  <text x="1040" y="445" textAnchor="middle" className="text-xs fill-white">Risk Analysis</text>
                  
                  {/* Data Layer */}
                  <rect x="50" y="510" width="1100" height="120" fill="#f59e0b" rx="8" opacity="0.1" />
                  <text x="70" y="535" className="text-sm font-semibold fill-amber-800">Data Management Layer</text>
                  
                  {/* PostgreSQL */}
                  <rect x="80" y="550" width="200" height="60" fill="#d97706" rx="4" />
                  <text x="180" y="575" textAnchor="middle" className="text-sm font-medium fill-white">PostgreSQL</text>
                  <text x="180" y="595" textAnchor="middle" className="text-xs fill-white">Primary Database</text>
                  
                  {/* SDTM Domains */}
                  <rect x="300" y="550" width="200" height="60" fill="#d97706" rx="4" />
                  <text x="400" y="575" textAnchor="middle" className="text-sm font-medium fill-white">SDTM Domains</text>
                  <text x="400" y="595" textAnchor="middle" className="text-xs fill-white">Clinical Data Standards</text>
                  
                  {/* CTMS Integration */}
                  <rect x="520" y="550" width="200" height="60" fill="#d97706" rx="4" />
                  <text x="620" y="575" textAnchor="middle" className="text-sm font-medium fill-white">CTMS Integration</text>
                  <text x="620" y="595" textAnchor="middle" className="text-xs fill-white">Trial Management</text>
                  
                  {/* Data Validation */}
                  <rect x="740" y="550" width="200" height="60" fill="#d97706" rx="4" />
                  <text x="840" y="575" textAnchor="middle" className="text-sm font-medium fill-white">Data Validation</text>
                  <text x="840" y="595" textAnchor="middle" className="text-xs fill-white">Quality Assurance</text>
                  
                  {/* Audit Trail */}
                  <rect x="960" y="550" width="160" height="60" fill="#d97706" rx="4" />
                  <text x="1040" y="575" textAnchor="middle" className="text-sm font-medium fill-white">Audit Trail</text>
                  <text x="1040" y="595" textAnchor="middle" className="text-xs fill-white">Compliance</text>
                  
                  {/* External Integrations */}
                  <rect x="50" y="660" width="1100" height="100" fill="#ef4444" rx="8" opacity="0.1" />
                  <text x="70" y="685" className="text-sm font-semibold fill-red-800">External Integrations</text>
                  
                  {/* EDC Systems */}
                  <rect x="80" y="700" width="180" height="50" fill="#dc2626" rx="4" />
                  <text x="170" y="720" textAnchor="middle" className="text-sm font-medium fill-white">EDC Systems</text>
                  <text x="170" y="735" textAnchor="middle" className="text-xs fill-white">Clinical Data Capture</text>
                  
                  {/* Lab Systems */}
                  <rect x="280" y="700" width="180" height="50" fill="#dc2626" rx="4" />
                  <text x="370" y="720" textAnchor="middle" className="text-sm font-medium fill-white">Laboratory Systems</text>
                  <text x="370" y="735" textAnchor="middle" className="text-xs fill-white">Central, Local Labs</text>
                  
                  {/* Imaging */}
                  <rect x="480" y="700" width="180" height="50" fill="#dc2626" rx="4" />
                  <text x="570" y="720" textAnchor="middle" className="text-sm font-medium fill-white">Imaging Systems</text>
                  <text x="570" y="735" textAnchor="middle" className="text-xs fill-white">RECIST, Tumor Data</text>
                  
                  {/* Regulatory */}
                  <rect x="680" y="700" width="180" height="50" fill="#dc2626" rx="4" />
                  <text x="770" y="720" textAnchor="middle" className="text-sm font-medium fill-white">Regulatory Systems</text>
                  <text x="770" y="735" textAnchor="middle" className="text-xs fill-white">Safety Reporting</text>
                  
                  {/* Email */}
                  <rect x="880" y="700" width="180" height="50" fill="#dc2626" rx="4" />
                  <text x="970" y="720" textAnchor="middle" className="text-sm font-medium fill-white">Email Services</text>
                  <text x="970" y="735" textAnchor="middle" className="text-xs fill-white">Notifications, Alerts</text>
                  
                  {/* Arrows showing data flow */}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
                    </marker>
                  </defs>
                  
                  {/* Frontend to Backend */}
                  <line x1="600" y1="200" x2="600" y2="230" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
                  
                  {/* Backend to AI */}
                  <line x1="600" y1="330" x2="600" y2="360" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
                  
                  {/* AI to Data */}
                  <line x1="600" y1="480" x2="600" y2="510" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
                  
                  {/* Data to External */}
                  <line x1="600" y1="630" x2="600" y2="660" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />
                </svg>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="font-medium">Frontend Layer</span>
                  </div>
                  <p className="text-sm text-gray-600">React.js with TypeScript, real-time dashboards, responsive design</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-600 rounded"></div>
                    <span className="font-medium">Backend Services</span>
                  </div>
                  <p className="text-sm text-gray-600">Express.js API, WebSocket, session management, file processing</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-600 rounded"></div>
                    <span className="font-medium">AI/ML Processing</span>
                  </div>
                  <p className="text-sm text-gray-600">OpenAI integration, vector database, AI agents, rule engine</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-600 rounded"></div>
                    <span className="font-medium">Data Management</span>
                  </div>
                  <p className="text-sm text-gray-600">PostgreSQL, SDTM domains, CTMS, validation, audit trails</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datamodel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Model Architecture
              </CardTitle>
              <CardDescription>
                Complete database schema and relationships for Clinical Agents platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-50 rounded-lg p-8 overflow-x-auto">
                <svg viewBox="0 0 1400 1000" className="w-full h-auto max-w-none" style={{ minWidth: "1400px" }}>
                  {/* Background */}
                  <rect width="1400" height="1000" fill="#f8fafc" />
                  
                  {/* Title */}
                  <text x="700" y="30" textAnchor="middle" className="text-xl font-bold fill-gray-800">
                    Clinical Agents - Database Schema & Relationships
                  </text>
                  
                  {/* Core Entities Section */}
                  <rect x="50" y="60" width="600" height="280" fill="#3b82f6" rx="8" opacity="0.1" />
                  <text x="70" y="85" className="text-sm font-semibold fill-blue-800">Core Entities</text>
                  
                  {/* Users Table */}
                  <rect x="80" y="100" width="180" height="120" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" rx="4" />
                  <rect x="80" y="100" width="180" height="25" fill="#3b82f6" rx="4" />
                  <text x="170" y="118" textAnchor="middle" className="text-sm font-medium fill-white">users</text>
                  <text x="90" y="140" className="text-xs fill-gray-700">• id (PK)</text>
                  <text x="90" y="155" className="text-xs fill-gray-700">• username</text>
                  <text x="90" y="170" className="text-xs fill-gray-700">• email</text>
                  <text x="90" y="185" className="text-xs fill-gray-700">• role</text>
                  <text x="90" y="200" className="text-xs fill-gray-700">• created_at</text>
                  
                  {/* Trials Table */}
                  <rect x="280" y="100" width="180" height="120" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" rx="4" />
                  <rect x="280" y="100" width="180" height="25" fill="#3b82f6" rx="4" />
                  <text x="370" y="118" textAnchor="middle" className="text-sm font-medium fill-white">trials</text>
                  <text x="290" y="140" className="text-xs fill-gray-700">• id (PK)</text>
                  <text x="290" y="155" className="text-xs fill-gray-700">• protocol_number</text>
                  <text x="290" y="170" className="text-xs fill-gray-700">• title</text>
                  <text x="290" y="185" className="text-xs fill-gray-700">• phase</text>
                  <text x="290" y="200" className="text-xs fill-gray-700">• status</text>
                  
                  {/* Trial Users Junction */}
                  <rect x="480" y="100" width="150" height="120" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" rx="4" />
                  <rect x="480" y="100" width="150" height="25" fill="#3b82f6" rx="4" />
                  <text x="555" y="118" textAnchor="middle" className="text-sm font-medium fill-white">trial_users</text>
                  <text x="490" y="140" className="text-xs fill-gray-700">• user_id (FK)</text>
                  <text x="490" y="155" className="text-xs fill-gray-700">• trial_id (FK)</text>
                  <text x="490" y="170" className="text-xs fill-gray-700">• role</text>
                  <text x="490" y="185" className="text-xs fill-gray-700">• permissions</text>
                  
                  {/* Resource Profiles */}
                  <rect x="80" y="240" width="180" height="80" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" rx="4" />
                  <rect x="80" y="240" width="180" height="25" fill="#3b82f6" rx="4" />
                  <text x="170" y="258" textAnchor="middle" className="text-sm font-medium fill-white">resource_profiles</text>
                  <text x="90" y="280" className="text-xs fill-gray-700">• id (PK)</text>
                  <text x="90" y="295" className="text-xs fill-gray-700">• trial_id (FK)</text>
                  <text x="90" y="310" className="text-xs fill-gray-700">• resource_data</text>
                  
                  {/* Vendors */}
                  <rect x="280" y="240" width="180" height="80" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" rx="4" />
                  <rect x="280" y="240" width="180" height="25" fill="#3b82f6" rx="4" />
                  <text x="370" y="258" textAnchor="middle" className="text-sm font-medium fill-white">vendors</text>
                  <text x="290" y="280" className="text-xs fill-gray-700">• id (PK)</text>
                  <text x="290" y="295" className="text-xs fill-gray-700">• trial_id (FK)</text>
                  <text x="290" y="310" className="text-xs fill-gray-700">• vendor_data</text>
                  
                  {/* Domain Data Section */}
                  <rect x="700" y="60" width="650" height="280" fill="#10b981" rx="8" opacity="0.1" />
                  <text x="720" y="85" className="text-sm font-semibold fill-green-800">Domain Data Management</text>
                  
                  {/* Domain Sources */}
                  <rect x="730" y="100" width="180" height="120" fill="#ffffff" stroke="#10b981" strokeWidth="2" rx="4" />
                  <rect x="730" y="100" width="180" height="25" fill="#10b981" rx="4" />
                  <text x="820" y="118" textAnchor="middle" className="text-sm font-medium fill-white">domain_sources</text>
                  <text x="740" y="140" className="text-xs fill-gray-700">• id (PK)</text>
                  <text x="740" y="155" className="text-xs fill-gray-700">• trial_id (FK)</text>
                  <text x="740" y="170" className="text-xs fill-gray-700">• domain</text>
                  <text x="740" y="185" className="text-xs fill-gray-700">• source</text>
                  <text x="740" y="200" className="text-xs fill-gray-700">• source_type</text>
                  
                  {/* Domain Data */}
                  <rect x="930" y="100" width="180" height="120" fill="#ffffff" stroke="#10b981" strokeWidth="2" rx="4" />
                  <rect x="930" y="100" width="180" height="25" fill="#10b981" rx="4" />
                  <text x="1020" y="118" textAnchor="middle" className="text-sm font-medium fill-white">domain_data</text>
                  <text x="940" y="140" className="text-xs fill-gray-700">• id (PK)</text>
                  <text x="940" y="155" className="text-xs fill-gray-700">• trial_id (FK)</text>
                  <text x="940" y="170" className="text-xs fill-gray-700">• domain</text>
                  <text x="940" y="185" className="text-xs fill-gray-700">• source</text>
                  <text x="940" y="200" className="text-xs fill-gray-700">• record_data (JSON)</text>
                  
                  {/* SDTM Domains */}
                  <rect x="1130" y="100" width="190" height="120" fill="#ffffff" stroke="#10b981" strokeWidth="2" rx="4" />
                  <rect x="1130" y="100" width="190" height="25" fill="#10b981" rx="4" />
                  <text x="1225" y="118" textAnchor="middle" className="text-sm font-medium fill-white">SDTM Domains</text>
                  <text x="1140" y="140" className="text-xs fill-gray-700">• DM (Demographics)</text>
                  <text x="1140" y="155" className="text-xs fill-gray-700">• AE (Adverse Events)</text>
                  <text x="1140" y="170" className="text-xs fill-gray-700">• LB (Laboratory)</text>
                  <text x="1140" y="185" className="text-xs fill-gray-700">• VS (Vital Signs)</text>
                  <text x="1140" y="200" className="text-xs fill-gray-700">• CM, EX, SV, TU...</text>
                  
                  {/* Data Inconsistencies */}
                  <rect x="730" y="240" width="280" height="80" fill="#ffffff" stroke="#10b981" strokeWidth="2" rx="4" />
                  <rect x="730" y="240" width="280" height="25" fill="#10b981" rx="4" />
                  <text x="870" y="258" textAnchor="middle" className="text-sm font-medium fill-white">data_inconsistencies</text>
                  <text x="740" y="280" className="text-xs fill-gray-700">• id, trial_id (FK), domain, source</text>
                  <text x="740" y="295" className="text-xs fill-gray-700">• inconsistency_type, severity, status</text>
                  <text x="740" y="310" className="text-xs fill-gray-700">• description, detected_at</text>
                  
                  {/* AI & Signal Detection Section */}
                  <rect x="50" y="370" width="650" height="280" fill="#8b5cf6" rx="8" opacity="0.1" />
                  <text x="70" y="395" className="text-sm font-semibold fill-purple-800">AI & Signal Detection</text>
                  
                  {/* Signal Detection */}
                  <rect x="80" y="410" width="180" height="120" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" rx="4" />
                  <rect x="80" y="410" width="180" height="25" fill="#8b5cf6" rx="4" />
                  <text x="170" y="428" textAnchor="middle" className="text-sm font-medium fill-white">signal_detection</text>
                  <text x="90" y="450" className="text-xs fill-gray-700">• id (PK)</text>
                  <text x="90" y="465" className="text-xs fill-gray-700">• trial_id (FK)</text>
                  <text x="90" y="480" className="text-xs fill-gray-700">• signal_type</text>
                  <text x="90" y="495" className="text-xs fill-gray-700">• detection_method</text>
                  <text x="90" y="510" className="text-xs fill-gray-700">• priority, status</text>
                  
                  {/* Agent Status */}
                  <rect x="280" y="410" width="180" height="120" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" rx="4" />
                  <rect x="280" y="410" width="180" height="25" fill="#8b5cf6" rx="4" />
                  <text x="370" y="428" textAnchor="middle" className="text-sm font-medium fill-white">agent_status</text>
                  <text x="290" y="450" className="text-xs fill-gray-700">• id (PK)</text>
                  <text x="290" y="465" className="text-xs fill-gray-700">• trial_id (FK)</text>
                  <text x="290" y="480" className="text-xs fill-gray-700">• agent_type</text>
                  <text x="290" y="495" className="text-xs fill-gray-700">• status, last_run</text>
                  <text x="290" y="510" className="text-xs fill-gray-700">• records_processed</text>
                  
                  {/* Agent Workflows */}
                  <rect x="480" y="410" width="180" height="120" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" rx="4" />
                  <rect x="480" y="410" width="180" height="25" fill="#8b5cf6" rx="4" />
                  <text x="570" y="428" textAnchor="middle" className="text-sm font-medium fill-white">agent_workflows</text>
                  <text x="490" y="450" className="text-xs fill-gray-700">• id (PK)</text>
                  <text x="490" y="465" className="text-xs fill-gray-700">• trial_id (FK)</text>
                  <text x="490" y="480" className="text-xs fill-gray-700">• workflow_name</text>
                  <text x="490" y="495" className="text-xs fill-gray-700">• configuration</text>
                  <text x="490" y="510" className="text-xs fill-gray-700">• enabled, frequency</text>
                  
                  {/* OpenAI Queries */}
                  <rect x="80" y="550" width="280" height="80" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" rx="4" />
                  <rect x="80" y="550" width="280" height="25" fill="#8b5cf6" rx="4" />
                  <text x="220" y="568" textAnchor="middle" className="text-sm font-medium fill-white">openai_queries</text>
                  <text x="90" y="590" className="text-xs fill-gray-700">• id, trial_id (FK), query_type, prompt</text>
                  <text x="90" y="605" className="text-xs fill-gray-700">• response, tokens_used, created_at</text>
                  <text x="90" y="620" className="text-xs fill-gray-700">• model_version, cost</text>
                  
                  {/* Task Management Section */}
                  <rect x="750" y="370" width="600" height="280" fill="#f59e0b" rx="8" opacity="0.1" />
                  <text x="770" y="395" className="text-sm font-semibold fill-amber-800">Task & Notification Management</text>
                  
                  {/* Tasks */}
                  <rect x="780" y="410" width="180" height="120" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" rx="4" />
                  <rect x="780" y="410" width="180" height="25" fill="#f59e0b" rx="4" />
                  <text x="870" y="428" textAnchor="middle" className="text-sm font-medium fill-white">tasks</text>
                  <text x="790" y="450" className="text-xs fill-gray-700">• id (PK)</text>
                  <text x="790" y="465" className="text-xs fill-gray-700">• trial_id (FK)</text>
                  <text x="790" y="480" className="text-xs fill-gray-700">• assigned_to (FK)</text>
                  <text x="790" y="495" className="text-xs fill-gray-700">• title, description</text>
                  <text x="790" y="510" className="text-xs fill-gray-700">• priority, status</text>
                  
                  {/* Notifications */}
                  <rect x="980" y="410" width="180" height="120" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" rx="4" />
                  <rect x="980" y="410" width="180" height="25" fill="#f59e0b" rx="4" />
                  <text x="1070" y="428" textAnchor="middle" className="text-sm font-medium fill-white">notifications</text>
                  <text x="990" y="450" className="text-xs fill-gray-700">• id (PK)</text>
                  <text x="990" y="465" className="text-xs fill-gray-700">• user_id (FK)</text>
                  <text x="990" y="480" className="text-xs fill-gray-700">• task_id (FK)</text>
                  <text x="990" y="495" className="text-xs fill-gray-700">• type, message</text>
                  <text x="990" y="510" className="text-xs fill-gray-700">• read_status</text>
                  
                  {/* Notification Settings */}
                  <rect x="780" y="550" width="180" height="80" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" rx="4" />
                  <rect x="780" y="550" width="180" height="25" fill="#f59e0b" rx="4" />
                  <text x="870" y="568" textAnchor="middle" className="text-sm font-medium fill-white">notification_settings</text>
                  <text x="790" y="590" className="text-xs fill-gray-700">• user_id (FK)</text>
                  <text x="790" y="605" className="text-xs fill-gray-700">• email_enabled</text>
                  <text x="790" y="620" className="text-xs fill-gray-700">• push_enabled</text>
                  
                  {/* Read Status */}
                  <rect x="980" y="550" width="180" height="80" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" rx="4" />
                  <rect x="980" y="550" width="180" height="25" fill="#f59e0b" rx="4" />
                  <text x="1070" y="568" textAnchor="middle" className="text-sm font-medium fill-white">notification_read_status</text>
                  <text x="990" y="590" className="text-xs fill-gray-700">• user_id (FK)</text>
                  <text x="990" y="605" className="text-xs fill-gray-700">• notification_id (FK)</text>
                  <text x="990" y="620" className="text-xs fill-gray-700">• read_at</text>
                  
                  {/* Audit & Security Section */}
                  <rect x="50" y="680" width="1300" height="150" fill="#ef4444" rx="8" opacity="0.1" />
                  <text x="70" y="705" className="text-sm font-semibold fill-red-800">Audit Trail & Security</text>
                  
                  {/* Audit Logs */}
                  <rect x="80" y="720" width="200" height="90" fill="#ffffff" stroke="#ef4444" strokeWidth="2" rx="4" />
                  <rect x="80" y="720" width="200" height="25" fill="#ef4444" rx="4" />
                  <text x="180" y="738" textAnchor="middle" className="text-sm font-medium fill-white">audit_logs</text>
                  <text x="90" y="760" className="text-xs fill-gray-700">• id, user_id (FK), action</text>
                  <text x="90" y="775" className="text-xs fill-gray-700">• table_name, record_id</text>
                  <text x="90" y="790" className="text-xs fill-gray-700">• old_values, new_values</text>
                  <text x="90" y="805" className="text-xs fill-gray-700">• timestamp, ip_address</text>
                  
                  {/* User Sessions */}
                  <rect x="300" y="720" width="200" height="90" fill="#ffffff" stroke="#ef4444" strokeWidth="2" rx="4" />
                  <rect x="300" y="720" width="200" height="25" fill="#ef4444" rx="4" />
                  <text x="400" y="738" textAnchor="middle" className="text-sm font-medium fill-white">user_sessions</text>
                  <text x="310" y="760" className="text-xs fill-gray-700">• session_id (PK)</text>
                  <text x="310" y="775" className="text-xs fill-gray-700">• user_id (FK)</text>
                  <text x="310" y="790" className="text-xs fill-gray-700">• expires_at, data</text>
                  <text x="310" y="805" className="text-xs fill-gray-700">• created_at, last_accessed</text>
                  
                  {/* API Keys */}
                  <rect x="520" y="720" width="200" height="90" fill="#ffffff" stroke="#ef4444" strokeWidth="2" rx="4" />
                  <rect x="520" y="720" width="200" height="25" fill="#ef4444" rx="4" />
                  <text x="620" y="738" textAnchor="middle" className="text-sm font-medium fill-white">api_keys</text>
                  <text x="530" y="760" className="text-xs fill-gray-700">• id, user_id (FK)</text>
                  <text x="530" y="775" className="text-xs fill-gray-700">• key_hash, name</text>
                  <text x="530" y="790" className="text-xs fill-gray-700">• permissions, expires_at</text>
                  <text x="530" y="805" className="text-xs fill-gray-700">• last_used, created_at</text>
                  
                  {/* File Uploads */}
                  <rect x="740" y="720" width="200" height="90" fill="#ffffff" stroke="#ef4444" strokeWidth="2" rx="4" />
                  <rect x="740" y="720" width="200" height="25" fill="#ef4444" rx="4" />
                  <text x="840" y="738" textAnchor="middle" className="text-sm font-medium fill-white">file_uploads</text>
                  <text x="750" y="760" className="text-xs fill-gray-700">• id, user_id (FK)</text>
                  <text x="750" y="775" className="text-xs fill-gray-700">• filename, file_path</text>
                  <text x="750" y="790" className="text-xs fill-gray-700">• file_size, mime_type</text>
                  <text x="750" y="805" className="text-xs fill-gray-700">• upload_status, created_at</text>
                  
                  {/* System Logs */}
                  <rect x="960" y="720" width="200" height="90" fill="#ffffff" stroke="#ef4444" strokeWidth="2" rx="4" />
                  <rect x="960" y="720" width="200" height="25" fill="#ef4444" rx="4" />
                  <text x="1060" y="738" textAnchor="middle" className="text-sm font-medium fill-white">system_logs</text>
                  <text x="970" y="760" className="text-xs fill-gray-700">• id, level, message</text>
                  <text x="970" y="775" className="text-xs fill-gray-700">• source, error_details</text>
                  <text x="970" y="790" className="text-xs fill-gray-700">• request_id, user_id</text>
                  <text x="970" y="805" className="text-xs fill-gray-700">• timestamp, stack_trace</text>
                  
                  {/* Configuration */}
                  <rect x="1180" y="720" width="150" height="90" fill="#ffffff" stroke="#ef4444" strokeWidth="2" rx="4" />
                  <rect x="1180" y="720" width="150" height="25" fill="#ef4444" rx="4" />
                  <text x="1255" y="738" textAnchor="middle" className="text-sm font-medium fill-white">config</text>
                  <text x="1190" y="760" className="text-xs fill-gray-700">• key, value</text>
                  <text x="1190" y="775" className="text-xs fill-gray-700">• category</text>
                  <text x="1190" y="790" className="text-xs fill-gray-700">• description</text>
                  <text x="1190" y="805" className="text-xs fill-gray-700">• updated_at</text>
                  
                  {/* Relationship arrows */}
                  <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
                    </marker>
                  </defs>
                  
                  {/* Users to Trial Users */}
                  <line x1="260" y1="160" x2="480" y2="160" stroke="#374151" strokeWidth="1" markerEnd="url(#arrow)" />
                  
                  {/* Trials to Trial Users */}
                  <line x1="460" y1="160" x2="480" y2="160" stroke="#374151" strokeWidth="1" markerEnd="url(#arrow)" />
                  
                  {/* Trials to Domain Sources */}
                  <line x1="460" y1="160" x2="730" y2="160" stroke="#374151" strokeWidth="1" markerEnd="url(#arrow)" />
                  
                  {/* Domain Sources to Domain Data */}
                  <line x1="910" y1="160" x2="930" y2="160" stroke="#374151" strokeWidth="1" markerEnd="url(#arrow)" />
                  
                  {/* Trials to Signal Detection */}
                  <line x1="370" y1="220" x2="370" y2="340" stroke="#374151" strokeWidth="1" />
                  <line x1="370" y1="340" x2="170" y2="340" stroke="#374151" strokeWidth="1" />
                  <line x1="170" y1="340" x2="170" y2="410" stroke="#374151" strokeWidth="1" markerEnd="url(#arrow)" />
                  
                  {/* Signal Detection to Tasks */}
                  <line x1="260" y1="470" x2="780" y2="470" stroke="#374151" strokeWidth="1" markerEnd="url(#arrow)" />
                  
                  {/* Users to Tasks */}
                  <line x1="170" y1="220" x2="170" y2="340" stroke="#374151" strokeWidth="1" />
                  <line x1="170" y1="340" x2="870" y2="340" stroke="#374151" strokeWidth="1" />
                  <line x1="870" y1="340" x2="870" y2="410" stroke="#374151" strokeWidth="1" markerEnd="url(#arrow)" />
                  
                  {/* Tasks to Notifications */}
                  <line x1="960" y1="470" x2="980" y2="470" stroke="#374151" strokeWidth="1" markerEnd="url(#arrow)" />
                  
                  {/* Users to Audit Logs */}
                  <line x1="170" y1="220" x2="170" y2="680" stroke="#374151" strokeWidth="1" />
                  <line x1="170" y1="680" x2="180" y2="680" stroke="#374151" strokeWidth="1" />
                  <line x1="180" y1="680" x2="180" y2="720" stroke="#374151" strokeWidth="1" markerEnd="url(#arrow)" />
                </svg>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Core Entities</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Users:</strong> Authentication, roles, permissions</p>
                    <p><strong>Trials:</strong> Clinical trial metadata</p>
                    <p><strong>Trial Users:</strong> Role-based access control</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Domain Data</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Sources:</strong> EDC, Lab, Imaging systems</p>
                    <p><strong>SDTM:</strong> 15+ standardized domains</p>
                    <p><strong>Validation:</strong> Data quality checks</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">AI Processing</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Agents:</strong> Autonomous monitoring</p>
                    <p><strong>Signals:</strong> Risk detection algorithms</p>
                    <p><strong>OpenAI:</strong> LLM query tracking</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <span className="font-semibold">Security & Audit</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Audit Logs:</strong> Complete change tracking</p>
                    <p><strong>Sessions:</strong> Secure authentication</p>
                    <p><strong>API Keys:</strong> Programmatic access</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Key Relationships
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">1:N</Badge>
                  <span>Trial → Domain Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">M:N</Badge>
                  <span>Users ↔ Trials</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">1:N</Badge>
                  <span>Signal → Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">1:N</Badge>
                  <span>User → Notifications</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CloudCog className="h-4 w-4" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>• <strong>EDC:</strong> Clinical data capture</div>
                <div>• <strong>Central Lab:</strong> Laboratory results</div>
                <div>• <strong>Local Lab:</strong> Site-specific tests</div>
                <div>• <strong>Imaging:</strong> RECIST tumor data</div>
                <div>• <strong>CTMS:</strong> Trial management</div>
                <div>• <strong>Safety:</strong> Adverse events</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  Data Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>1. Data ingestion from external sources</div>
                <div>2. Validation and quality checks</div>
                <div>3. AI processing and signal detection</div>
                <div>4. Task creation and assignment</div>
                <div>5. Notification delivery</div>
                <div>6. Audit trail recording</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}