import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Draggable from 'react-draggable';
import {
  Bot,
  X,
  Send,
  Sparkles,
  BrainCircuit,
  Maximize2,
  Minimize2,
  ArrowRightCircle,
  Move,
  Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trial, SignalDetection, Task, Site } from "@shared/schema";

// Types for messages
type MessageType = "user" | "bot" | "suggestion" | "error";

interface Message {
  id: string;
  type: MessageType;
  content: string;
  links?: {
    text: string;
    path: string;
  }[];
  timestamp: Date;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch data for AI suggestions
  const { data: trials = [], isError: trialsError } = useQuery<Trial[]>({
    queryKey: ['/api/trials'],
    enabled: isOpen,
    retry: 2,
    staleTime: 60000, // 1 minute
  });

  const { data: signalDetections = [], isError: signalsError } = useQuery<SignalDetection[]>({
    queryKey: ['/api/signaldetections'],
    enabled: isOpen,
    retry: 2,
    staleTime: 60000, // 1 minute
  });

  const { data: tasks = [], isError: tasksError } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: isOpen,
    retry: 2,
    staleTime: 60000, // 1 minute
  });
  
  const { data: sites = [], isError: sitesError } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
    enabled: isOpen,
    retry: 2,
    staleTime: 60000, // 1 minute
  });

  // Generate random ID for messages
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Process user input and generate response
  const processUserInput = async () => {
    if (!userInput.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      type: "user",
      content: userInput,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput("");
    setIsTyping(true);
    
    try {
      // Simulate AI thinking
      setTimeout(() => {
        const response = generateAIResponse(userInput.toLowerCase());
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      // Handle errors
      console.error("Error generating AI response:", error);
      setMessages(prev => [...prev, {
        id: generateId(),
        type: "error",
        content: "I'm sorry, I couldn't process your request at this time. Please try again later.",
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }
  };

  // Generate AI response based on user input
  const generateAIResponse = (input: string): Message => {
    const lowerInput = input.toLowerCase();
    
    // Check for specific queries - use exact word matching with word boundaries
    if (/\b(trial|study|studies|protocol)\b/.test(lowerInput)) {
      let trialList = "";
      if (trials && trials.length > 0) {
        trialList = "\n\nClinical Trials:\n";
        trials.forEach((trial, index) => {
          trialList += `${index + 1}. Protocol: ${trial.protocolId} - ${trial.title}\n   Status: ${trial.status}, Phase: ${trial.phase}\n`;
          if (trial.indication) {
            trialList += `   Indication: ${trial.indication}\n`;
          }
        });
      }
      
      return {
        id: generateId(),
        type: "bot",
        content: `I found ${trials ? trials.length : 0} clinical trials in the system.${trialList}`,
        links: [
          { text: "View All Studies", path: "/study-management" },
          ...(trials ? trials.map(trial => ({ 
            text: trial.title, 
            path: `/study-management?id=${trial.id}` 
          })).slice(0, 3) : [])
        ],
        timestamp: new Date(),
      };
    }
    
    if (/\b(signal|detection|risk|alert)\b/.test(lowerInput)) {
      const highRiskCount = signalDetections ? signalDetections.filter(s => 
        s.priority === "high" || s.priority === "High" || s.priority === "HIGH"
      ).length : 0;
      
      let detectionList = "";
      if (signalDetections && signalDetections.length > 0) {
        detectionList = "\n\nSignal Detections:\n";
        signalDetections.forEach((signal, index) => {
          detectionList += `${index + 1}. ID: ${signal.detectionId} - ${signal.title} (${signal.priority} priority)\n`;
        });
      }
      
      return {
        id: generateId(),
        type: "bot",
        content: `I found ${signalDetections ? signalDetections.length : 0} signal detections, including ${highRiskCount} high-risk signals that may need immediate attention.${detectionList}`,
        links: [
          { text: "View Signal Detections", path: "/signal-detection" },
          { text: "View Risk Profiles", path: "/risk-profiles" }
        ],
        timestamp: new Date(),
      };
    }
    
    if (/\b(task|todo|assignment|work|action)\b/.test(lowerInput)) {
      const overdueTasks = tasks ? tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && 
        (t.status !== "completed" && t.status !== "Completed" && t.status !== "COMPLETED")
      ).length : 0;
      
      let taskList = "";
      if (tasks && tasks.length > 0) {
        taskList = "\n\nTasks:\n";
        tasks.forEach((task, index) => {
          const status = task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : "Unknown";
          taskList += `${index + 1}. ${task.taskId} - ${task.title} (${status}, Priority: ${task.priority})\n`;
        });
      }
      
      return {
        id: generateId(),
        type: "bot",
        content: `There are ${tasks ? tasks.length : 0} tasks in the system, with ${overdueTasks} overdue tasks that need attention.${taskList}`,
        links: [
          { text: "View Tasks", path: "/tasks" },
          { text: "Create New Task", path: "/tasks/create" }
        ],
        timestamp: new Date(),
      };
    }
    
    if (/\b(dashboard|overview|summary|home)\b/.test(lowerInput)) {
      return {
        id: generateId(),
        type: "bot",
        content: "The dashboard provides a comprehensive overview of your clinical trials, including key metrics, recent activities, and important alerts.",
        links: [
          { text: "Go to Dashboard", path: "/" }
        ],
        timestamp: new Date(),
      };
    }
    
    if (/\b(site|center|location|clinic|hospital)\b/.test(lowerInput)) {
      let siteList = "";
      if (sites && sites.length > 0) {
        siteList = "\n\nSites/Centers:\n";
        sites.forEach((site, index) => {
          siteList += `${index + 1}. ${site.siteId} - ${site.name}\n   Location: ${site.location || 'Unknown'}\n   Status: ${site.status || 'Active'}\n`;
        });
      }
      
      return {
        id: generateId(),
        type: "bot",
        content: `I found ${sites ? sites.length : 0} clinical sites in the system.${siteList}`,
        links: [
          { text: "View Study Management", path: "/study-management" },
          ...(sites ? sites.map(site => ({ 
            text: `View ${site.name}`, 
            path: `/study-management?site=${site.id}` 
          })).slice(0, 3) : [])
        ],
        timestamp: new Date(),
      };
    }
    
    if (/\b(data|compliance|query|management|dm)\b/.test(lowerInput)) {
      return {
        id: generateId(),
        type: "bot",
        content: "The DM Compliance module helps you monitor data quality, compliance, and manage queries across your clinical trials.",
        links: [
          { text: "Go to DM Compliance", path: "/data-management" }
        ],
        timestamp: new Date(),
      };
    }
    
    // Admin module intelligence
    if (/\b(admin|administration|settings|configure|setup)\b/.test(lowerInput)) {
      return {
        id: generateId(),
        type: "bot",
        content: "The Administration module provides tools for managing system settings, users, security, and audit logs.",
        links: [
          { text: "Admin Dashboard", path: "/admin" },
          { text: "User Management", path: "/admin/users" },
          { text: "Security Settings", path: "/admin/security" },
          { text: "Audit Logs", path: "/admin/logs" }
        ],
        timestamp: new Date(),
      };
    }
    
    if (/\b(user|account|permission|role|login|credential)\b/.test(lowerInput)) {
      return {
        id: generateId(),
        type: "bot",
        content: "User management in the Admin module helps you manage user accounts, roles, and permissions across the system.",
        links: [
          { text: "User Management", path: "/admin/users" }
        ],
        timestamp: new Date(),
      };
    }
    
    if (/\b(security|password|policy|access|protected|authentication)\b/.test(lowerInput)) {
      return {
        id: generateId(),
        type: "bot",
        content: "Security settings allow administrators to configure password policies, access controls, and authentication methods.",
        links: [
          { text: "Security Settings", path: "/admin/security" }
        ],
        timestamp: new Date(),
      };
    }
    
    if (/\b(audit|log|history|activity|tracking|record)\b/.test(lowerInput)) {
      return {
        id: generateId(),
        type: "bot",
        content: "Audit logs provide a comprehensive record of system activities, user actions, and security events for compliance and troubleshooting.",
        links: [
          { text: "View Audit Logs", path: "/admin/logs" }
        ],
        timestamp: new Date(),
      };
    }
    
    if (/\b(integrate|connection|external|api|interface|sync|connect)\b/.test(lowerInput)) {
      return {
        id: generateId(),
        type: "bot",
        content: "The system supports integration with external data sources such as EDC, CTMS, IRT, LIMS, and Supply Chain systems to optimize trial management.",
        links: [
          { text: "Integration Settings", path: "/admin/settings" }
        ],
        timestamp: new Date(),
      };
    }
    
    if (/\b(profile|vendor|resource|quality|compliance|monitor|oversight|assessment)\b/.test(lowerInput)) {
      return {
        id: generateId(),
        type: "bot",
        content: "The system maintains various profiles including Risk, Quality, Compliance, Safety, Vendor, Financial, and Resources profiles to provide comprehensive oversight of clinical trials.",
        links: [
          { text: "Risk Profiles", path: "/risk-profiles" },
          { text: "Vendor Management", path: "/admin/settings" },
          { text: "Resource Management", path: "/admin/settings" }
        ],
        timestamp: new Date(),
      };
    }
    
    // Default response with suggestions
    return {
      id: generateId(),
      type: "bot",
      content: "I can help you navigate the Clinical Business Orchestration and AI Technology Platform system. Here are some areas I can assist with:",
      links: [
        { text: "Clinical Trials Overview", path: "/study-management" },
        { text: "Clinical Sites", path: "/study-management?tab=sites" },
        { text: "Task Management", path: "/tasks" },
        { text: "Signal Detection", path: "/signal-detection" },
        { text: "Risk Profiles", path: "/risk-profiles" },
        { text: "Data Management", path: "/data-management" },
        { text: "Administration", path: "/admin" }
      ],
      timestamp: new Date(),
    };
  };

  // Handle link click
  const handleLinkClick = (path: string) => {
    setLocation(path);
    if (window.innerWidth < 768) {
      setIsOpen(false); // Close on mobile
    }
  };

  // Toggle chat window
  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  // Toggle minimize
  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  // Render messages
  const renderMessage = (message: Message) => {
    switch (message.type) {
      case "user":
        return (
          <div key={message.id} className="flex justify-end mb-3">
            <div className="bg-blue-100 text-blue-900 rounded-lg p-3 max-w-[80%]">
              <p>{message.content}</p>
            </div>
          </div>
        );
      
      case "bot":
        return (
          <div key={message.id} className="flex mb-3">
            <div className="bg-white border rounded-lg p-3 max-w-[80%] shadow-sm">
              <p className="mb-2">{message.content}</p>
              {message.links && message.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.links.map((link, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      size="sm" 
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => handleLinkClick(link.path)}
                    >
                      {link.text}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case "suggestion":
        return (
          <div key={message.id} className="mb-3">
            <div className="bg-gray-100 border rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {message.links && message.links.map((link, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => handleLinkClick(link.path)}
                  >
                    {link.text}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );
      
      case "error":
        return (
          <div key={message.id} className="flex mb-3">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 max-w-[80%]">
              <p>{message.content}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 border-red-200 hover:bg-red-50 mt-2"
                onClick={() => setMessages(prev => prev.filter(m => m.id !== message.id))}
              >
                Dismiss
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Reference for draggable component
  const nodeRef = useRef(null);
  
  // State for position
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Reset position when closed
  useEffect(() => {
    if (!isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {/* AI Button */}
      <Button
        onClick={toggleChat}
        variant={isOpen ? "default" : "secondary"}
        size="sm"
        className="rounded-full h-10 w-10 p-0 shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <BrainCircuit className="h-5 w-5" />
        )}
      </Button>
      
      {/* AI Chat Window - Draggable */}
      {isOpen && (
        <Draggable
          nodeRef={nodeRef}
          handle=".handle"
          defaultPosition={position}
          position={position}
          onStop={(e, data) => {
            setPosition({ x: data.x, y: data.y });
          }}
          bounds="body"
        >
          <div 
            ref={nodeRef}
            className={`mt-2 bg-white rounded-lg border shadow-xl overflow-hidden transition-all flex flex-col
              ${isMinimized ? 'h-14 w-72' : 'h-[500px] w-80'}`}
            style={{ position: 'absolute', top: 0, right: 0 }}
          >
            {/* Header */}
            <div className="bg-blue-600 text-white p-3 flex justify-between items-center relative">
              <div className="flex items-center cursor-grab handle">
                <Move className="h-4 w-4 mr-2" />
                <BrainCircuit className="h-5 w-5 mr-2" />
                <h3 className="font-medium">cBOAT AI Assistant</h3>
              </div>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white hover:bg-blue-700 hover:text-white"
                  onClick={toggleMinimize}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white hover:bg-blue-700 hover:text-white ml-1"
                  onClick={toggleChat}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {!isMinimized && (
              <>
                {/* Messages Section */}
                <div className="flex-1 p-3 space-y-4 overflow-y-auto">
                  {messages.map(message => renderMessage(message))}
                  
                  {isTyping && (
                    <div className="flex mb-3">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Input Section */}
                <div className="p-3 border-t">
                  <div className="flex space-x-2">
                    <Textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type your message here..."
                      className="min-h-0 h-10 resize-none flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          processUserInput();
                        }
                      }}
                    />
                    <Button
                      className="h-10 w-10 p-0"
                      onClick={processUserInput}
                      disabled={!userInput.trim() || isTyping}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Ask about trials, sites, tasks, signals, data management, or admin functions
                  </div>
                </div>
              </>
            )}
          </div>
        </Draggable>
      )}
    </div>
  );
}