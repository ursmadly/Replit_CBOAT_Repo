import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Eye, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ProtocolNode {
  id: string;
  title: string;
  content: string;
  status: 'incomplete' | 'complete' | 'edited';
  expanded?: boolean;
  children?: ProtocolNode[];
}

export interface ProtocolTreeProps {
  nodes: ProtocolNode[];
  onNodeSelect?: (node: ProtocolNode) => void;
  onNodeEdit?: (node: ProtocolNode) => void;
  onNodeDelete?: (node: ProtocolNode) => void;
  onNodeToggle?: (node: ProtocolNode, expanded: boolean) => void;
  headerContent?: React.ReactNode;
  isEditable?: boolean;
}

export const ProtocolTree: React.FC<ProtocolTreeProps> = ({
  nodes,
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
  onNodeToggle,
  headerContent,
  isEditable = true
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(nodes.filter(n => n.expanded).map(n => n.id))
  );

  const handleToggle = (node: ProtocolNode) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(node.id)) {
      newExpanded.delete(node.id);
      if (onNodeToggle) onNodeToggle(node, false);
    } else {
      newExpanded.add(node.id);
      if (onNodeToggle) onNodeToggle(node, true);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: ProtocolNode, index: number, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div 
        key={node.id} 
        className={`pl-${level * 4} border-l-2 border-gray-100 dark:border-gray-800 ml-2 ${index > 0 ? 'mt-2' : ''}`}
      >
        <div className="flex items-center py-2 pl-2">
          <button
            onClick={() => handleToggle(node)}
            className="mr-1 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4 text-gray-400" />
            )}
          </button>
          
          <div 
            className="flex-grow font-medium cursor-pointer text-sm hover:text-primary transition-colors"
            onClick={() => onNodeSelect?.(node)}
          >
            {node.title}
          </div>
          
          <div className="flex items-center space-x-1">
            <Badge 
              variant={node.status === 'complete' ? 'default' : node.status === 'edited' ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {node.status === 'complete' ? 'Complete' : node.status === 'edited' ? 'Edited' : 'Incomplete'}
            </Badge>
            
            {isEditable && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onNodeEdit?.(node)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  onClick={() => onNodeDelete?.(node)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="pl-6 pr-2 pb-2">
            {node.content && (
              <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-md whitespace-pre-wrap">
                {node.content}
              </div>
            )}
            
            {hasChildren && (
              <div className="mt-2">
                {node.children!.map((child, idx) => renderNode(child, idx, level + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      {headerContent && (
        <CardHeader className="pb-2">
          {headerContent}
        </CardHeader>
      )}
      <CardContent className="pt-2">
        <ScrollArea className="h-[600px] pr-4">
          {nodes.map((node, idx) => renderNode(node, idx))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ProtocolTree;