import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Database, Plus, Search, Trash2, FileText, RotateCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

// Interfaces
interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

// Form validation schemas
const createCollectionSchema = z.object({
  name: z.string().min(3, "Collection name must be at least 3 characters")
    .max(50, "Collection name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Collection name can only contain letters, numbers, hyphens, and underscores")
});

const addDocumentSchema = z.object({
  id: z.string().min(3, "Document ID must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Document ID can only contain letters, numbers, hyphens, and underscores"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  source: z.string().optional(),
  domain: z.string().optional(),
  trialId: z.number().optional(),
  siteId: z.number().optional(),
  subjectId: z.string().optional()
});

const searchSchema = z.object({
  query: z.string().min(3, "Search query must be at least 3 characters"),
  topK: z.number().min(1).max(100).default(10)
});

export default function VectorDatabaseManager() {
  const [activeTab, setActiveTab] = useState("collections");
  const [activeCollection, setActiveCollection] = useState("");
  const [searchResults, setSearchResults] = useState<VectorSearchResult[]>([]);
  const [addDocumentDialogOpen, setAddDocumentDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Forms
  const createCollectionForm = useForm<z.infer<typeof createCollectionSchema>>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: { name: "" }
  });

  const addDocumentForm = useForm<z.infer<typeof addDocumentSchema>>({
    resolver: zodResolver(addDocumentSchema),
    defaultValues: { 
      id: "", 
      content: "", 
      source: "EDC", 
      domain: "DM" 
    }
  });

  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: "", topK: 10 }
  });

  // Queries
  const collectionsQuery = useQuery({
    queryKey: ["/api/vector/collections"],
    queryFn: async () => {
      const response = await fetch("/api/vector/collections");
      if (!response.ok) throw new Error("Failed to fetch collections");
      return response.json();
    }
  });

  const countQuery = useQuery({
    queryKey: ["/api/vector/collections", activeCollection, "count"],
    queryFn: async () => {
      if (!activeCollection) return { count: 0 };
      const response = await fetch(`/api/vector/collections/${activeCollection}/count`);
      if (!response.ok) throw new Error("Failed to count documents");
      return response.json();
    },
    enabled: !!activeCollection
  });

  // Mutations
  const createCollectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createCollectionSchema>) => {
      return apiRequest("/api/vector/collections", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vector/collections"] });
      createCollectionForm.reset();
      toast({
        title: "Collection created",
        description: "Vector database collection has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to create collection:", error);
      toast({
        title: "Failed to create collection",
        description: "There was an error creating the collection. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (collectionName: string) => {
      return apiRequest(`/api/vector/collections/${collectionName}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vector/collections"] });
      if (activeCollection) {
        setActiveCollection("");
      }
      toast({
        title: "Collection deleted",
        description: "Vector database collection has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete collection:", error);
      toast({
        title: "Failed to delete collection",
        description: "There was an error deleting the collection. Please try again.",
        variant: "destructive",
      });
    }
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (data: { collection: string, document: VectorDocument }) => {
      return apiRequest(`/api/vector/collections/${data.collection}/documents`, {
        method: "POST",
        body: JSON.stringify({ documents: [data.document] }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vector/collections", activeCollection, "count"] });
      addDocumentForm.reset();
      setAddDocumentDialogOpen(false);
      toast({
        title: "Document added",
        description: "Document has been added to the vector database successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to add document:", error);
      toast({
        title: "Failed to add document",
        description: "There was an error adding the document. Please try again.",
        variant: "destructive",
      });
    }
  });

  const searchMutation = useMutation({
    mutationFn: async (data: { collection: string, query: string, topK: number }) => {
      return apiRequest(`/api/vector/collections/${data.collection}/search`, {
        method: "POST",
        body: JSON.stringify({ query: data.query, topK: data.topK }),
      });
    },
    onSuccess: (data) => {
      setSearchResults(data.results);
    },
    onError: (error) => {
      console.error("Failed to search:", error);
      toast({
        title: "Search failed",
        description: "There was an error performing the search. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Effect to handle document count loading
  useEffect(() => {
    if (activeCollection) {
      queryClient.invalidateQueries({ queryKey: ["/api/vector/collections", activeCollection, "count"] });
    }
  }, [activeCollection, queryClient]);

  // Form submissions
  const onCreateCollection = (data: z.infer<typeof createCollectionSchema>) => {
    createCollectionMutation.mutate(data);
  };

  const onAddDocument = (data: z.infer<typeof addDocumentSchema>) => {
    if (!activeCollection) {
      toast({
        title: "No collection selected",
        description: "Please select a collection first.",
        variant: "destructive",
      });
      return;
    }

    const { id, content, ...metadataFields } = data;
    const metadata: Record<string, any> = {};
    
    // Add non-empty metadata fields
    Object.entries(metadataFields).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        metadata[key] = value;
      }
    });

    addDocumentMutation.mutate({
      collection: activeCollection,
      document: { id, content, metadata }
    });
  };

  const onSearch = (data: z.infer<typeof searchSchema>) => {
    if (!activeCollection) {
      toast({
        title: "No collection selected",
        description: "Please select a collection first.",
        variant: "destructive",
      });
      return;
    }

    searchMutation.mutate({
      collection: activeCollection,
      query: data.query,
      topK: data.topK
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vector Database</CardTitle>
            <CardDescription>
              Semantic search and retrieval of clinical trial data
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              In-memory vector database
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="collections" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create Collection</CardTitle>
                    <CardDescription>Add a new vector collection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...createCollectionForm}>
                      <form onSubmit={createCollectionForm.handleSubmit(onCreateCollection)} className="space-y-4">
                        <FormField
                          control={createCollectionForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Collection Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. clinical_notes" {...field} />
                              </FormControl>
                              <FormDescription>
                                Use lowercase letters, numbers, and underscores
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={createCollectionMutation.isPending}
                        >
                          {createCollectionMutation.isPending ? (
                            <>
                              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Collection
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Collections</CardTitle>
                    <CardDescription>Manage your vector database collections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {collectionsQuery.isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : collectionsQuery.isError ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          Failed to load collections. Please try again.
                        </AlertDescription>
                      </Alert>
                    ) : collectionsQuery.data?.collections.length === 0 ? (
                      <div className="text-center py-8">
                        <Database className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                        <h3 className="mt-4 text-lg font-medium">No collections found</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Create your first collection to get started.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {collectionsQuery.data?.collections.map((collection: string) => (
                          <div 
                            key={collection}
                            className={`flex justify-between items-center p-4 border rounded-md ${
                              activeCollection === collection ? 'border-primary bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <Database className="mr-2 h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">{collection}</p>
                                <p className="text-sm text-muted-foreground">
                                  {activeCollection === collection && countQuery.data ? (
                                    `${countQuery.data.count} documents`
                                  ) : (
                                    "Select to view details"
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant={activeCollection === collection ? "secondary" : "outline"} 
                                size="sm"
                                onClick={() => setActiveCollection(collection)}
                              >
                                {activeCollection === collection ? "Selected" : "Select"}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-destructive"
                                onClick={() => deleteCollectionMutation.mutate(collection)}
                                disabled={deleteCollectionMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <div className="space-y-6">
              {!activeCollection ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle>No collection selected</AlertTitle>
                  <AlertDescription>
                    Please select a collection from the Collections tab to manage documents.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">Documents in <Badge variant="outline">{activeCollection}</Badge></h3>
                      <p className="text-sm text-muted-foreground">
                        {countQuery.isLoading ? (
                          "Loading document count..."
                        ) : (
                          `${countQuery.data?.count || 0} documents in this collection`
                        )}
                      </p>
                    </div>
                    <Button onClick={() => setAddDocumentDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Document
                    </Button>
                  </div>

                  {countQuery.data?.count === 0 && (
                    <div className="text-center py-12 border rounded-md">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No documents found</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add your first document to this collection.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setAddDocumentDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Document
                      </Button>
                    </div>
                  )}

                  {countQuery.data?.count > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Collection Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Collection Name</span>
                            <span>{activeCollection}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Document Count</span>
                            <span>{countQuery.data?.count || 0}</span>
                          </div>
                          <div>
                            <span className="font-medium">Storage Usage</span>
                            <Progress value={30} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              In-memory storage (no persistent storage used)
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Add Document Dialog */}
            <Dialog open={addDocumentDialogOpen} onOpenChange={setAddDocumentDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Document to {activeCollection}</DialogTitle>
                  <DialogDescription>
                    Add a new document to the vector database for semantic search capabilities.
                  </DialogDescription>
                </DialogHeader>
                <Form {...addDocumentForm}>
                  <form onSubmit={addDocumentForm.handleSubmit(onAddDocument)} className="space-y-4">
                    <FormField
                      control={addDocumentForm.control}
                      name="id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document ID</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. patient_101_notes" {...field} />
                          </FormControl>
                          <FormDescription>
                            A unique identifier for this document
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addDocumentForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter the full text content of your document..." 
                              rows={6}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            This text will be indexed for semantic search
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addDocumentForm.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Source</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. EDC, Lab, Imaging" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addDocumentForm.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domain</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. DM, AE, LB" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={addDocumentForm.control}
                        name="trialId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trial ID</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} 
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addDocumentForm.control}
                        name="siteId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site ID</FormLabel>
                            <FormControl>
                              <Input type="number" {...field}
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addDocumentForm.control}
                        name="subjectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject ID</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={addDocumentMutation.isPending}
                      >
                        {addDocumentMutation.isPending ? (
                          <>
                            <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Document"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="search" className="mt-0">
            <div className="space-y-6">
              {!activeCollection ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle>No collection selected</AlertTitle>
                  <AlertDescription>
                    Please select a collection from the Collections tab to search documents.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Semantic Search</CardTitle>
                      <CardDescription>
                        Search the vector database using natural language queries
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...searchForm}>
                        <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <FormField
                                control={searchForm.control}
                                name="query"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          placeholder="Enter your search query..."
                                          className="pl-8"
                                          {...field}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={searchForm.control}
                              name="topK"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Results"
                                      className="w-24"
                                      {...field}
                                      onChange={e => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button 
                              type="submit" 
                              disabled={searchMutation.isPending}
                            >
                              {searchMutation.isPending ? (
                                <>
                                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                                  Searching...
                                </>
                              ) : (
                                "Search"
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  {searchResults.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Search Results</CardTitle>
                        <CardDescription>
                          {searchResults.length} results found matching your query
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document ID</TableHead>
                              <TableHead>Content Preview</TableHead>
                              <TableHead>Metadata</TableHead>
                              <TableHead className="text-right">Relevance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {searchResults.map((result) => (
                              <TableRow key={result.id}>
                                <TableCell className="font-medium">{result.id}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {result.content.length > 100 
                                    ? `${result.content.substring(0, 100)}...` 
                                    : result.content}
                                </TableCell>
                                <TableCell>
                                  {Object.entries(result.metadata).map(([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium">{key}</span>: {value}
                                    </div>
                                  ))}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={result.score > 0.8 ? "default" : "secondary"}>
                                    {(result.score * 100).toFixed(1)}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Search Dialog */}
            <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Advanced Search</DialogTitle>
                  <DialogDescription>
                    Search for documents with more advanced filtering options.
                  </DialogDescription>
                </DialogHeader>
                {/* Advanced search form would go here */}
                <DialogFooter>
                  <Button onClick={() => setSearchDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}