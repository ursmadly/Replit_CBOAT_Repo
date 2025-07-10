import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/utils";

interface ExportMenuProps {
  data: any[];
  filename?: string;
  title?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  label?: string;
  className?: string;
  entityType?: string; // Added for backward compatibility
}

export default function ExportMenu({
  data,
  filename,
  title,
  variant = "outline",
  size = "sm",
  showIcon = true,
  label = "Export",
  className = "",
  entityType,
}: ExportMenuProps) {
  // If entityType is provided but filename is not, generate a filename from entityType
  if (!filename && entityType) {
    filename = `${entityType}_export`;
  } else if (!filename) {
    filename = 'data_export';
  }
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`gap-1 ${className}`}>
          {showIcon && <Download className="h-4 w-4" />}
          <span>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToCSV(data, filename || 'data_export')}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Export as CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToExcel(data, `${filename || 'data_export'}.xlsx`)}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Export as Excel</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToPDF(data, filename || 'data_export', title)}>
          <File className="mr-2 h-4 w-4" />
          <span>Export as PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}