import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Plus, Search, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import DomainRecordEditor from './DomainRecordEditor';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface DomainRecord {
  id: number;
  trialId: number;
  domain: string;
  source: string;
  recordId: string;
  recordData: string;
  importedAt: string;
}

interface DomainDataTableProps {
  trialId: number;
  domain: string;
  source: string;
}

const DomainDataTable: React.FC<DomainDataTableProps> = ({ trialId, domain, source }) => {
  const [records, setRecords] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredRecords, setFilteredRecords] = useState<DomainRecord[]>([]);
  // Setting expandedView to false means compact view is default
  const [expandedView, setExpandedView] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Get columns from the first record
  const columns = useMemo(() => {
    if (records.length === 0) return [];
    try {
      // Log the first record for debugging
      console.log('First record:', records[0]);
      
      const recordDataRaw = records[0].recordData;
      console.log('Record data raw:', recordDataRaw);
      
      // Try to parse the record data
      const firstRecord = JSON.parse(recordDataRaw);
      console.log('Parsed record:', firstRecord);
      
      const extractedColumns = Object.keys(firstRecord);
      console.log('Extracted columns:', extractedColumns);
      
      return extractedColumns;
    } catch (error) {
      console.error('Error parsing record data to extract columns:', error);
      return [];
    }
  }, [records]);

  // Fetch domain data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use regular fetch to ensure we handle the response correctly
      const url = `/api/domain-data?trialId=${trialId}&domain=${domain}&source=${encodeURIComponent(source)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // Handle 404 case (no data found)
        if (response.status === 404) {
          setRecords([]);
          setFilteredRecords([]);
          return;
        }
        
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setRecords(data.data);
        setFilteredRecords(data.data);
      } else {
        throw new Error('No data returned from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching domain data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [trialId, domain, source]);

  // Filter records when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRecords(records);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = records.filter(record => {
      // Search in the recordId
      if (record.recordId.toLowerCase().includes(query)) {
        return true;
      }

      // Search in the record data if it's a JSON string
      try {
        const parsedData = JSON.parse(record.recordData);
        // Check if any value in the parsed data contains the search query
        return Object.values(parsedData).some(
          value => String(value).toLowerCase().includes(query)
        );
      } catch {
        // If parsing fails, search in the raw record data
        return record.recordData.toLowerCase().includes(query);
      }
    });

    setFilteredRecords(filtered);
  }, [searchQuery, records]);

  // Delete a record
  const handleDelete = async (id: number) => {
    try {
      // Use apiRequest with proper object format
      await apiRequest({
        url: `/api/domain-records/${id}`,
        method: 'DELETE'
      });
      
      toast({
        title: 'Record deleted',
        description: 'The record has been successfully deleted.',
      });

      // Remove the deleted record from the state
      setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
      setFilteredRecords(prevRecords => prevRecords.filter(record => record.id !== id));
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete record',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchData();
  };

  // After save callback
  const handleSaveComplete = () => {
    fetchData();
    setEditingRecord(null);
    setIsAddDialogOpen(false);
    
    // Invalidate domain data queries with properly encoded source
    const queryKeyPath = `/api/domain-data?trialId=${trialId}&domain=${domain}&source=${encodeURIComponent(source)}`;
    queryClient.invalidateQueries({ queryKey: [queryKeyPath] });
  };

  // Parse and display record data
  const renderRecordData = (recordData: string) => {
    try {
      const parsed = JSON.parse(recordData);
      return (
        <div className="text-sm">
          {Object.entries(parsed).map(([key, value]) => (
            <div key={key} className="mb-1 pb-1 border-b border-gray-100 last:border-0">
              <span className="font-medium whitespace-nowrap">{key}:</span> <span className="break-words">{String(value)}</span>
            </div>
          ))}
        </div>
      );
    } catch (err) {
      console.error('Error parsing record data:', err);
      return <span className="text-sm text-muted-foreground">Unable to parse record data</span>;
    }
  };
  
  // Get value for a specific column from record data
  const getColumnValue = (recordData: string, column: string) => {
    try {
      const parsed = JSON.parse(recordData);
      if (filteredRecords.length > 0 && column === columns[0]) {
        console.log('Sample record data:', parsed);
      }
      return String(parsed[column] || '');
    } catch (error) {
      console.error('Error parsing record data for column', column, error);
      return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Always show view toggle button, regardless of domain type */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setExpandedView(!expandedView)}
            title={expandedView ? "Switch to compact view" : "Display all columns in table"}
          >
            {expandedView ? 
              <><ChevronDown className="h-4 w-4 mr-1" /> Compact View</> : 
              <><ChevronRight className="h-4 w-4 mr-1" /> Show All Columns</>
            }
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Add New Record</DialogTitle>
              </DialogHeader>
              <DomainRecordEditor
                trialId={trialId}
                domain={domain}
                source={source}
                onSave={handleSaveComplete}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <p className="text-gray-500">No records found</p>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search query
            </p>
          )}
          {!searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Click the "Add Record" button above to create a new record
            </p>
          )}
        </div>
      ) : (
        <div className="border rounded-md relative">
          <ScrollArea className="h-[calc(100vh-300px)]" scrollHideDelay={0}>
            <Table>
              <TableHeader className="sticky top-0 bg-white z-20">
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-30 whitespace-nowrap">Record ID</TableHead>
                  {expandedView ? (
                    columns.map((column) => (
                      <TableHead key={column} className="whitespace-nowrap">
                        {column}
                      </TableHead>
                    ))
                  ) : (
                    <TableHead>Data</TableHead>
                  )}
                  <TableHead className="whitespace-nowrap">Import Date</TableHead>
                  <TableHead className="w-24 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium sticky left-0 bg-white z-10 whitespace-nowrap">{record.recordId}</TableCell>
                    {expandedView ? (
                      columns.map((column) => (
                        <TableCell key={column} className="whitespace-nowrap max-w-xs truncate">
                          {getColumnValue(record.recordData, column)}
                        </TableCell>
                      ))
                    ) : (
                      <TableCell className="max-w-lg w-[400px]">
                        <ScrollArea className="h-[150px] w-full">
                          {renderRecordData(record.recordData)}
                        </ScrollArea>
                      </TableCell>
                    )}
                    <TableCell className="whitespace-nowrap">
                      {new Date(record.importedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Dialog open={editingRecord === record.id} onOpenChange={(open) => !open && setEditingRecord(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Edit Record</DialogTitle>
                            </DialogHeader>
                            <DomainRecordEditor
                              recordId={record.id}
                              trialId={trialId}
                              domain={domain}
                              source={source}
                              onSave={handleSaveComplete}
                              onCancel={() => setEditingRecord(null)}
                              isEditing={true}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(record.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              record and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DomainDataTable;