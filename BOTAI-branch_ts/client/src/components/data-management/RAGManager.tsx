import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CircleHelpIcon, Database, Lightbulb, Search, Upload, Edit3, MessageSquare, AlertCircle, Zap, FileDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define types
interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

interface RAGQueryOptions {
  collectionName: string;
  query: string;
  topK?: number;
  filter?: Record<string, any>;
  includeContent?: boolean;
  maxTokens?: number;
}

interface RAGResponse {
  answer: string;
  sourceDocuments?: {
    id: string;
    content: string;
    metadata: Record<string, any>;
    score: number;
  }[];
  error?: string;
}

export default function RAGManager() {
  const [activeTab, setActiveTab] = useState("query");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [query, setQuery] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [documentMetadata, setDocumentMetadata] = useState<string>("{}");
  const [documentId, setDocumentId] = useState("");
  const [topK, setTopK] = useState(5);
  const [includeSources, setIncludeSources] = useState<boolean>(true);
  const [selectedStudies, setSelectedStudies] = useState<number[]>([1, 2]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch collections
  const { data: collectionsData, isLoading: isLoadingCollections, refetch: refetchCollections } = useQuery<{ collections: string[] }>({
    queryKey: ["/api/vector/collections"],
    retry: 1,
  });
  
  const collections = collectionsData?.collections || [];

  // Create a new collection
  const createCollectionMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("/api/vector/collections", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Collection created",
        description: `Collection "${newCollectionName}" was created successfully.`,
      });
      setNewCollectionName("");
      refetchCollections();
    },
    onError: (error) => {
      toast({
        title: "Error creating collection",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Ingest a document
  const ingestDocumentMutation = useMutation({
    mutationFn: async (document: VectorDocument) => {
      return apiRequest("/api/rag/ingest", {
        method: "POST",
        body: JSON.stringify({
          collectionName: selectedCollection,
          documents: [document],
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Document ingested",
        description: "Document was added to the knowledge base successfully.",
      });
      setDocumentContent("");
      setDocumentMetadata("{}");
      setDocumentId("");
      queryClient.invalidateQueries({ queryKey: ["/api/vector/collections", selectedCollection, "count"] });
    },
    onError: (error) => {
      toast({
        title: "Error ingesting document",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Query the RAG model
  const [ragResponse, setRagResponse] = useState<RAGResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  
  const submitQuery = async () => {
    if (!selectedCollection || !query) {
      toast({
        title: "Missing information",
        description: "Please select a collection and enter a query.",
        variant: "destructive",
      });
      return;
    }

    setIsQuerying(true);
    try {
      const options: RAGQueryOptions = {
        collectionName: selectedCollection,
        query,
        topK,
        includeContent: includeSources,
      };

      const response = await apiRequest("/api/rag/query", {
        method: "POST",
        body: JSON.stringify(options),
      });
      
      setRagResponse(response as RAGResponse);
    } catch (error) {
      toast({
        title: "Error querying RAG model",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsQuerying(false);
    }
  };

  // Get document count in collection
  const { data: collectionCount, isLoading: isLoadingCount } = useQuery({
    queryKey: ["/api/vector/collections", selectedCollection, "count"],
    queryFn: async () => {
      if (!selectedCollection) return 0;
      const response = await fetch(`/api/vector/collections/${selectedCollection}/count`);
      if (!response.ok) throw new Error("Failed to get document count");
      const data = await response.json();
      return data.count;
    },
    enabled: !!selectedCollection,
  });

  // Handle metadata validation
  const validateMetadata = (metadata: string): boolean => {
    try {
      JSON.parse(metadata);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Handle document ingestion
  const handleIngestDocument = () => {
    if (!selectedCollection) {
      toast({
        title: "No collection selected",
        description: "Please select a collection first.",
        variant: "destructive",
      });
      return;
    }

    if (!documentContent) {
      toast({
        title: "Missing content",
        description: "Please enter document content.",
        variant: "destructive",
      });
      return;
    }

    if (!validateMetadata(documentMetadata)) {
      toast({
        title: "Invalid metadata",
        description: "Metadata must be a valid JSON object.",
        variant: "destructive",
      });
      return;
    }

    const generatedId = documentId || 
      `doc_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const document: VectorDocument = {
      id: generatedId,
      content: documentContent,
      metadata: JSON.parse(documentMetadata),
    };

    ingestDocumentMutation.mutate(document);
  };

  // Handle collection creation
  const handleCreateCollection = () => {
    if (!newCollectionName) {
      toast({
        title: "Missing collection name",
        description: "Please enter a name for the new collection.",
        variant: "destructive",
      });
      return;
    }

    createCollectionMutation.mutate(newCollectionName);
  };
  
  // Import trial data to RAG
  const importTrialDataMutation = useMutation({
    mutationFn: async (studyIds: number[]) => {
      return apiRequest("/api/rag/import-trial-data", {
        method: "POST",
        body: JSON.stringify({ studyIds }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Trial data imported",
        description: `Successfully imported ${data.documentsAdded} documents from ${data.studiesProcessed} studies.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vector/collections"] });
      if (selectedCollection) {
        queryClient.invalidateQueries({ queryKey: ["/api/vector/collections", selectedCollection, "count"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error importing trial data",
        description: String(error),
        variant: "destructive",
      });
    },
  });
  
  const handleImportTrialData = () => {
    if (selectedStudies.length === 0) {
      toast({
        title: "No studies selected",
        description: "Please select at least one study to import.",
        variant: "destructive",
      });
      return;
    }
    
    importTrialDataMutation.mutate(selectedStudies);
  };

  useEffect(() => {
    // If the collections are loaded and there's at least one collection, select the first one
    if (collections.length > 0 && !selectedCollection) {
      setSelectedCollection(collections[0]);
    }
  }, [collections, selectedCollection]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            <CardTitle>Retrieval Augmented Generation (RAG)</CardTitle>
          </div>
        </div>
        <CardDescription>
          Query clinical trial data using AI-powered retrieval for enhanced insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="query">
              <Search className="h-4 w-4 mr-2" />
              Query Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Add Documents
            </TabsTrigger>
            <TabsTrigger value="import">
              <FileDown className="h-4 w-4 mr-2" />
              Import Trial Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="query" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="collection-select">Knowledge Collection</Label>
                  {isLoadingCount ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    collectionCount !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {collectionCount} document{collectionCount === 1 ? "" : "s"}
                      </Badge>
                    )
                  )}
                </div>

                {isLoadingCollections ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedCollection}
                    onValueChange={setSelectedCollection}
                  >
                    <SelectTrigger id="collection-select">
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          No collections available
                        </SelectItem>
                      ) : (
                        collections.map((collection: string) => (
                          <SelectItem key={collection} value={collection}>
                            {collection}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="query-input">Your Query</Label>
                <Textarea
                  id="query-input"
                  placeholder="What safety issues were observed in the diabetes trial?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topK-select">Results to Consider</Label>
                  <Select
                    value={String(topK)}
                    onValueChange={(value) => setTopK(Number(value))}
                  >
                    <SelectTrigger id="topK-select">
                      <SelectValue placeholder="5" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 results</SelectItem>
                      <SelectItem value="5">5 results</SelectItem>
                      <SelectItem value="10">10 results</SelectItem>
                      <SelectItem value="20">20 results</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="include-sources">Include Sources</Label>
                    <input
                      type="checkbox"
                      id="include-sources"
                      checked={includeSources}
                      onChange={(e) => setIncludeSources(e.target.checked)}
                      className="form-checkbox h-4 w-4"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={submitQuery} 
                disabled={isQuerying || !selectedCollection || !query}
                className="mt-2"
              >
                {isQuerying ? (
                  <>Querying...</>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Query Knowledge Base
                  </>
                )}
              </Button>
            </div>

            {ragResponse && (
              <Card className="mt-6 border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-blue-600" />
                    AI Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-line">{ragResponse.answer}</p>
                  </div>

                  {ragResponse.sourceDocuments && ragResponse.sourceDocuments.length > 0 && (
                    <div className="mt-6">
                      <Separator className="my-4" />
                      <h4 className="font-medium mb-2 flex items-center">
                        <Database className="h-4 w-4 mr-2 text-gray-500" />
                        Source Documents
                      </h4>
                      <ScrollArea className="h-80">
                        <div className="space-y-4">
                          {ragResponse.sourceDocuments.map((doc, index) => (
                            <Card key={index} className="bg-gray-50">
                              <CardHeader className="py-3 px-4">
                                <div className="flex justify-between items-center">
                                  <Badge variant="outline" className="font-mono">
                                    ID: {doc.id.substring(0, 8)}...
                                  </Badge>
                                  <Badge variant="outline" className="bg-blue-50">
                                    Relevance: {(doc.score * 100).toFixed(1)}%
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="py-2 px-4">
                                <div className="text-sm">
                                  {doc.content.length > 300
                                    ? `${doc.content.substring(0, 300)}...`
                                    : doc.content}
                                </div>
                                {Object.keys(doc.metadata).length > 0 && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    <span className="font-medium">Metadata: </span>
                                    {JSON.stringify(doc.metadata)}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="collection-select-upload">Collection</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="New collection name"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="w-48 h-8"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateCollection}
                      disabled={createCollectionMutation.isPending || !newCollectionName}
                    >
                      Create
                    </Button>
                  </div>
                </div>

                {isLoadingCollections ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedCollection}
                    onValueChange={setSelectedCollection}
                  >
                    <SelectTrigger id="collection-select-upload">
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          No collections available
                        </SelectItem>
                      ) : (
                        collections.map((collection: string) => (
                          <SelectItem key={collection} value={collection}>
                            {collection}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Separator className="my-2" />

              <div className="space-y-2">
                <Label htmlFor="document-id">Document ID (optional)</Label>
                <Input
                  id="document-id"
                  placeholder="Unique identifier (generated if empty)"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-content">Document Content</Label>
                <Textarea
                  id="document-content"
                  placeholder="Enter the document text to be indexed in the knowledge base..."
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="document-metadata">
                    Metadata (JSON format)
                  </Label>
                  <div className="flex items-center text-xs text-gray-500">
                    <CircleHelpIcon className="h-3 w-3 mr-1" />
                    <span>Must be a valid JSON object</span>
                  </div>
                </div>
                <Textarea
                  id="document-metadata"
                  placeholder='{
  "source": "Clinical Study",
  "type": "Safety Report", 
  "date": "2025-03-15"
}'
                  value={documentMetadata}
                  onChange={(e) => setDocumentMetadata(e.target.value)}
                  className="font-mono text-sm min-h-28"
                />
                {documentMetadata && !validateMetadata(documentMetadata) && (
                  <div className="text-xs flex items-center text-red-500 mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Invalid JSON format
                  </div>
                )}
              </div>

              <Button
                className="mt-2"
                onClick={handleIngestDocument}
                disabled={
                  ingestDocumentMutation.isPending ||
                  !selectedCollection ||
                  !documentContent ||
                  (documentMetadata !== "" && !validateMetadata(documentMetadata))
                }
              >
                {ingestDocumentMutation.isPending ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Add to Knowledge Base
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="collection-select-import">Destination Collection</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="New collection name"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="w-48 h-8"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateCollection}
                      disabled={createCollectionMutation.isPending || !newCollectionName}
                    >
                      Create
                    </Button>
                  </div>
                </div>

                {isLoadingCollections ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedCollection}
                    onValueChange={setSelectedCollection}
                  >
                    <SelectTrigger id="collection-select-import">
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          No collections available
                        </SelectItem>
                      ) : (
                        collections.map((collection: string) => (
                          <SelectItem key={collection} value={collection}>
                            {collection}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Separator className="my-2" />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="studies-to-import">Studies to Import</Label>
                  <div className="flex items-center text-xs text-gray-500">
                    <CircleHelpIcon className="h-3 w-3 mr-1" />
                    <span>Select studies to import into the knowledge base</span>
                  </div>
                </div>
                
                <div className="space-y-3 mt-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="study-1"
                      checked={selectedStudies.includes(1)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudies((prev) => [...prev, 1].sort());
                        } else {
                          setSelectedStudies((prev) => prev.filter((id) => id !== 1));
                        }
                      }}
                      className="form-checkbox h-4 w-4"
                    />
                    <Label htmlFor="study-1">Study 1: Diabetes Type 2 Trial</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="study-2"
                      checked={selectedStudies.includes(2)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudies((prev) => [...prev, 2].sort());
                        } else {
                          setSelectedStudies((prev) => prev.filter((id) => id !== 2));
                        }
                      }}
                      className="form-checkbox h-4 w-4"
                    />
                    <Label htmlFor="study-2">Study 2: Oncology Phase III Trial</Label>
                  </div>
                </div>
              </div>

              <Card className="bg-blue-50 border-blue-200 p-4 mt-2">
                <div className="flex items-start gap-4">
                  <Zap className="h-10 w-10 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium mb-1">What gets imported?</h3>
                    <p className="text-sm text-gray-700">
                      Importing trial data will process and index the following into the RAG knowledge base:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
                      <li>All EDC data (patient records, lab values, adverse events)</li>
                      <li>Lab data (central and local labs with reference ranges)</li>
                      <li>CTMS data (site performance, monitoring reports)</li>
                      <li>Study metadata (protocol details, amendments, inclusion/exclusion)</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Button
                className="mt-4"
                onClick={handleImportTrialData}
                disabled={
                  importTrialDataMutation.isPending ||
                  !selectedCollection ||
                  selectedStudies.length === 0
                }
              >
                {importTrialDataMutation.isPending ? (
                  <>Importing Data...</>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Import Trial Data to Knowledge Base
                  </>
                )}
              </Button>
              
              {importTrialDataMutation.isSuccess && (
                <div className="flex items-center text-sm text-green-600 mt-2">
                  <div className="bg-green-100 rounded-full p-1 mr-2">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Trial data successfully imported and indexed for semantic search
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}