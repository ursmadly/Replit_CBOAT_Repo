/**
 * Utility functions for exporting data to CSV and Excel
 */

/**
 * Convert data array to CSV string
 */
export function convertToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return '';
  
  // Get headers from first item
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      // Handle special cases for CSV (quotes, commas, etc.)
      const value = item[header] === null || item[header] === undefined ? '' : item[header];
      const valueStr = String(value);
      
      // Escape quotes and wrap in quotes if contains comma or newline
      if (valueStr.includes(',') || valueStr.includes('"') || valueStr.includes('\n')) {
        return `"${valueStr.replace(/"/g, '""')}"`;
      }
      return valueStr;
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Export data to CSV file
 */
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  const csvContent = convertToCSV(data);
  
  // Create a Blob with the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element to trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  
  // Append link to body, click it, then remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Release the URL object
  URL.revokeObjectURL(url);
}

/**
 * Export data to Excel file
 * This uses a simple CSV approach that Excel can open as it doesn't require
 * the xlsx library, which would add extra dependencies
 */
export function exportToExcel(data: Record<string, any>[], filename: string): void {
  const csvContent = convertToCSV(data);
  
  // Create a Blob with the CSV data and Excel MIME type
  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element to trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.xls`);
  
  // Append link to body, click it, then remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Release the URL object
  URL.revokeObjectURL(url);
}