import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface DomainRecordEditorProps {
  recordId?: number;
  trialId: number;
  domain: string;
  source: string;
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

interface RecordField {
  name: string;
  value: string;
  required?: boolean;
}

const DomainRecordEditor: React.FC<DomainRecordEditorProps> = ({
  recordId,
  trialId,
  domain,
  source,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const [fields, setFields] = useState<RecordField[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(isEditing);
  const { toast } = useToast();

  // If editing an existing record, fetch its data
  useEffect(() => {
    if (isEditing && recordId) {
      setFetching(true);
      
      // Use regular fetch to avoid Response body issues
      fetch(`/api/domain-records/${recordId}`)
        .then(async response => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error (${response.status}): ${errorText}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success && data.data.parsedData) {
            // Convert object to field array
            const parsedFields = Object.entries(data.data.parsedData).map(([name, value]) => ({
              name,
              value: String(value),
              required: ['STUDYID', 'DOMAIN', 'USUBJID'].includes(name)
            }));
            setFields(parsedFields);
          }
        })
        .catch(error => {
          toast({
            title: 'Error',
            description: `Failed to load record: ${error.message}`,
            variant: 'destructive',
          });
        })
        .finally(() => setFetching(false));
    } else {
      // For new records, initialize with basic required fields
      setFields([
        { name: 'STUDYID', value: '', required: true },
        { name: 'DOMAIN', value: domain, required: true },
        { name: 'USUBJID', value: '', required: true },
      ]);
    }
  }, [recordId, isEditing, domain, toast]);

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...fields];
    newFields[index].value = value;
    setFields(newFields);
  };

  const addField = () => {
    setFields([...fields, { name: '', value: '' }]);
  };

  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleFieldNameChange = (index: number, name: string) => {
    const newFields = [...fields];
    newFields[index].name = name;
    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingRequired = fields.filter(f => f.required && !f.value);
    if (missingRequired.length > 0) {
      toast({
        title: 'Validation Error',
        description: `Missing required fields: ${missingRequired.map(f => f.name).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    // Convert fields to record object
    const recordData = fields.reduce((obj, field) => {
      if (field.name) {
        obj[field.name] = field.value;
      }
      return obj;
    }, {} as Record<string, string>);

    setLoading(true);

    try {
      if (isEditing && recordId) {
        // Update existing record using fetch directly
        console.log(`Updating record ${recordId} with data:`, recordData);
        const requestBody = { recordData };
        console.log('PUT request body:', JSON.stringify(requestBody));
        
        const response = await fetch(`/api/domain-records/${recordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }
        
        await response.json(); // Read response to completion
      } else {
        // Create new record using fetch directly
        const payload = {
          trialId,
          domain,
          source,
          recordData
        };
        
        const response = await fetch('/api/domain-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }
        
        await response.json(); // Read response to completion
      }

      toast({
        title: 'Success',
        description: isEditing ? 'Record updated successfully' : 'Record created successfully',
      });
      
      onSave();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} record: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6 flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading record data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b pb-3">
        <CardTitle>{isEditing ? 'Edit Record' : 'Add New Record'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 py-6">
          <div className="bg-slate-50 p-3 rounded-md mb-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-2 bg-slate-100 p-2 rounded">
              <div className="font-medium text-sm text-slate-700">Field Name</div>
              <div className="font-medium text-sm lg:col-span-2 text-slate-700">Field Value</div>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
              {fields.map((field, index) => (
                <div key={index} className="grid grid-cols-1 lg:grid-cols-3 gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center">
                    <Input
                      value={field.name}
                      onChange={(e) => handleFieldNameChange(index, e.target.value)}
                      placeholder="Field name"
                      className={field.required ? "border-primary font-medium" : ""}
                      readOnly={field.required}
                    />
                  </div>
                  <div className="flex items-start gap-2 lg:col-span-2">
                    <Textarea
                      value={field.value}
                      onChange={(e) => handleFieldChange(index, e.target.value)}
                      placeholder="Value"
                      className="resize-y min-h-[60px]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(index)}
                      disabled={field.required}
                      className="flex-shrink-0 mt-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Button type="button" variant="outline" onClick={addField} className="w-full">
            Add Field
          </Button>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="px-6">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Update Record' : 'Create Record'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default DomainRecordEditor;