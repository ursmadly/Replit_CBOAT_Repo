import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, CheckCircle2, Database, ArrowRightCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataSourceType } from "@/../../shared/schema";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DataManagementAgentProps {
  trialId: number;
  onSignalsCreated?: (signals: any[]) => void;
}

export default function DataManagementAgent({ trialId, onSignalsCreated }: DataManagementAgentProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([
    DataSourceType.EDC,
    DataSourceType.CTMS,
    DataSourceType.LAB_RESULTS
  ]);
  const [reviewOptions, setReviewOptions] = useState({
    checkConsistency: true,
    checkCompleteness: true,
    checkAccuracy: true,
    checkTimeliness: true
  });

  const handleSourceToggle = (source: string) => {
    if (selectedSources.includes(source)) {
      setSelectedSources(selectedSources.filter(s => s !== source));
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  };

  const runDataReview = async () => {
    if (selectedSources.length < 2) {
      toast({
        title: "Source Selection Required",
        description: "Please select at least two data sources to compare.",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setResults(null);

    try {
      const response = await apiRequest({
        url: '/api/ai/reviewdata',
        method: 'POST',
        data: {
          trialId,
          sources: selectedSources,
          options: reviewOptions
        }
      });

      setResults(response);
      
      if (onSignalsCreated && response.detections) {
        onSignalsCreated(response.detections);
      }

      toast({
        title: "Data Review Complete",
        description: `Found ${response.detections.length} potential issues across data sources.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error running data review:", error);
      toast({
        title: "Review Failed",
        description: "Failed to complete data review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2 text-blue-600" />
          Data Management Agent
        </CardTitle>
        <CardDescription>
          AI-driven data quality analysis across multiple data sources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Select Data Sources to Review</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(DataSourceType).map((source) => (
              <div key={source} className="flex items-center space-x-2">
                <Checkbox 
                  id={`source-${source}`} 
                  checked={selectedSources.includes(source)}
                  onCheckedChange={() => handleSourceToggle(source)}
                />
                <Label htmlFor={`source-${source}`}>{source}</Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Review Options</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="check-consistency" 
                checked={reviewOptions.checkConsistency}
                onCheckedChange={(checked) => 
                  setReviewOptions(prev => ({ ...prev, checkConsistency: !!checked }))
                }
              />
              <Label htmlFor="check-consistency">Data Consistency</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="check-completeness" 
                checked={reviewOptions.checkCompleteness}
                onCheckedChange={(checked) => 
                  setReviewOptions(prev => ({ ...prev, checkCompleteness: !!checked }))
                }
              />
              <Label htmlFor="check-completeness">Data Completeness</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="check-accuracy" 
                checked={reviewOptions.checkAccuracy}
                onCheckedChange={(checked) => 
                  setReviewOptions(prev => ({ ...prev, checkAccuracy: !!checked }))
                }
              />
              <Label htmlFor="check-accuracy">Data Accuracy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="check-timeliness" 
                checked={reviewOptions.checkTimeliness}
                onCheckedChange={(checked) => 
                  setReviewOptions(prev => ({ ...prev, checkTimeliness: !!checked }))
                }
              />
              <Label htmlFor="check-timeliness">Data Timeliness</Label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          disabled={isRunning || selectedSources.length < 2}
          onClick={() => {
            setSelectedSources([
              DataSourceType.EDC,
              DataSourceType.CTMS,
              DataSourceType.LAB_RESULTS
            ]);
            setReviewOptions({
              checkConsistency: true,
              checkCompleteness: true,
              checkAccuracy: true,
              checkTimeliness: true
            });
          }}
        >
          Reset
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              disabled={isRunning || selectedSources.length < 2}
              onClick={runDataReview}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Analysis...
                </>
              ) : (
                <>
                  Run Data Review
                </>
              )}
            </Button>
          </DialogTrigger>
          
          {results && (
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Data Review Results</DialogTitle>
                <DialogDescription>
                  Analysis method: {results.method}
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <div className="flex items-center gap-2 mb-3">
                  {results.detections.length > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  <p className="text-sm">
                    {results.message}
                  </p>
                </div>
                
                {results.detections.length > 0 && (
                  <ScrollArea className="h-[300px] rounded-md border p-4">
                    {results.detections.map((detection: any, index: number) => (
                      <div key={index} className="mb-4 last:mb-0 p-3 border-l-2 border-amber-500">
                        <h3 className="font-medium">{detection.title}</h3>
                        <p className="text-sm mt-1">{detection.observation}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {detection.priority} Priority
                          </span>
                          <Button size="sm" variant="ghost" className="h-6 text-xs">
                            <ArrowRightCircle className="h-3 w-3 mr-1" />
                            View Signal
                          </Button>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </CardFooter>
    </Card>
  );
}