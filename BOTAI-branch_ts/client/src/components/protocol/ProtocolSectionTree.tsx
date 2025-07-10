import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Edit, Eye, FileText, Plus, Save, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ProtocolTree, ProtocolNode } from './ProtocolTree';

export interface ProtocolSection {
  id: string;
  title: string;
  content: string;
  status: 'incomplete' | 'complete' | 'edited';
  expanded?: boolean;
}

export interface ProtocolCategory {
  title: string;
  icon: React.ElementType;
  sections: ProtocolSection[];
}

interface ProtocolSectionTreeProps {
  categories: ProtocolCategory[];
  onSectionUpdate?: (categoryIndex: number, sectionIndex: number, content: string) => void;
  onAddSection?: (categoryIndex: number) => void;
  onDeleteSection?: (categoryIndex: number, sectionIndex: number) => void;
  saveEnabled?: boolean;
  onSave?: () => void;
}

export const ProtocolSectionTree: React.FC<ProtocolSectionTreeProps> = ({
  categories,
  onSectionUpdate,
  onAddSection,
  onDeleteSection,
  saveEnabled = true,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [editingSection, setEditingSection] = useState<{ categoryIndex: number; sectionIndex: number } | null>(null);
  const [editContent, setEditContent] = useState('');

  // Convert categories/sections to the tree format
  const createTreeNodesFromCategories = () => {
    return categories.map(category => {
      const categoryNode: ProtocolNode = {
        id: `category-${category.title.toLowerCase().replace(/\s+/g, '-')}`,
        title: category.title,
        content: '',
        status: 'complete',
        expanded: true,
        children: category.sections.map(section => ({
          id: section.id,
          title: section.title,
          content: section.content,
          status: section.status,
          expanded: section.expanded
        }))
      };
      return categoryNode;
    });
  };

  const handleEditNode = (node: ProtocolNode) => {
    // Find which category and section this belongs to
    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      const category = categories[catIdx];
      
      for (let secIdx = 0; secIdx < category.sections.length; secIdx++) {
        const section = category.sections[secIdx];
        
        if (section.id === node.id) {
          setEditingSection({ categoryIndex: catIdx, sectionIndex: secIdx });
          setEditContent(section.content);
          return;
        }
      }
    }
  };

  const handleSaveEdit = () => {
    if (editingSection && onSectionUpdate) {
      onSectionUpdate(
        editingSection.categoryIndex,
        editingSection.sectionIndex,
        editContent
      );
    }
    setEditingSection(null);
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
  };

  const handleDeleteNode = (node: ProtocolNode) => {
    // Find which category and section this belongs to
    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      const category = categories[catIdx];
      
      for (let secIdx = 0; secIdx < category.sections.length; secIdx++) {
        const section = category.sections[secIdx];
        
        if (section.id === node.id && onDeleteSection) {
          onDeleteSection(catIdx, secIdx);
          return;
        }
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <Tabs 
        defaultValue="all" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All Sections</TabsTrigger>
            {categories.map((category, index) => (
              <TabsTrigger key={index} value={`category-${index}`}>
                {category.title}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {saveEnabled && (
            <Button onClick={onSave} className="ml-auto">
              <Save className="h-4 w-4 mr-2" /> Save Protocol
            </Button>
          )}
        </div>
        
        <TabsContent value="all" className="mt-0">
          {editingSection ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Editing: {categories[editingSection.categoryIndex].sections[editingSection.sectionIndex].title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={15}
                  className="font-mono"
                />
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ProtocolTree
              nodes={createTreeNodesFromCategories()}
              onNodeEdit={handleEditNode}
              onNodeDelete={handleDeleteNode}
              headerContent={
                <div className="flex items-center justify-between">
                  <CardTitle>Protocol Sections</CardTitle>
                </div>
              }
            />
          )}
        </TabsContent>
        
        {categories.map((category, index) => (
          <TabsContent key={index} value={`category-${index}`} className="mt-0">
            {editingSection && editingSection.categoryIndex === index ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Editing: {category.sections[editingSection.sectionIndex].title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={15}
                    className="font-mono"
                  />
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit}>
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <category.icon className="mr-2 h-5 w-5 text-primary" />
                      <CardTitle>{category.title}</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddSection?.(index)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Section
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {category.sections.map((section, sectionIndex) => (
                      <div key={section.id} className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium flex items-center">
                            <FileText className="h-4 w-4 text-primary mr-2" />
                            {section.title}
                            <Badge
                              variant={section.status === 'complete' ? 'default' : section.status === 'edited' ? 'secondary' : 'outline'}
                              className="ml-2 text-xs"
                            >
                              {section.status === 'complete' ? 'Complete' : section.status === 'edited' ? 'Edited' : 'Incomplete'}
                            </Badge>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSection({ categoryIndex: index, sectionIndex })}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              onClick={() => onDeleteSection?.(index, sectionIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="pl-6 pr-2">
                          <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-md whitespace-pre-wrap">
                            {section.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ProtocolSectionTree;