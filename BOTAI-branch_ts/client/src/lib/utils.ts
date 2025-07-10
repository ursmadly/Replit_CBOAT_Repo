import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Export data to CSV file
 * @param data Array of objects to export
 * @param filename Name of the file to download
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }
  
  // Get column headers from first object keys
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV format
  const csvContent = [
    // Add headers row
    headers.join(','),
    // Add data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle special cases: arrays, nulls, objects
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) return `"${value.join(', ')}"`;
        if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
        // Escape commas and quotes in strings
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return value;
      }).join(',')
    )
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to Excel (XLSX) file format
 * This exports as CSV with .xlsx extension, as a full Excel implementation 
 * would require additional libraries
 * @param data Array of objects to export
 * @param filename Name of the file to download
 */
export function exportToExcel(data: any[], filename: string) {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }
  
  // Use same CSV export but with .xlsx extension
  exportToCSV(data, filename.replace(/\.csv$/, ''));
}

/**
 * Export data to PDF format
 * This is a simplified version that converts data to a table and prints it
 * A full implementation would require additional libraries
 * @param data Array of objects to export
 * @param filename Name of the file to download
 * @param title Optional title for the PDF
 */
export function exportToPDF(data: any[], filename: string, title?: string) {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }
  
  // Create a window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }
  
  // Get column headers from first object keys
  const headers = Object.keys(data[0]);
  
  // Create HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2563eb; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th { background-color: #2563eb; color: white; text-align: left; padding: 8px; }
        td { border: 1px solid #ddd; padding: 8px; }
        tr:nth-child(even) { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>${title || filename}</h1>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) return '<td></td>';
                if (Array.isArray(value)) return `<td>${value.join(', ')}</td>`;
                if (typeof value === 'object') return `<td>${JSON.stringify(value)}</td>`;
                return `<td>${value}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  // Write content to window and print
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Slight delay to ensure content is loaded
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

/**
 * Generate simulated task completion data for the past N days
 * @param days Number of days of history to generate
 * @returns Array of data points with date and task counts
 */
export function generateTaskCompletionData(days: number): Array<{
  date: string;
  completed: number;
  created: number;
}> {
  const result = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate some reasonable values that might occur in real usage
    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.5 : 1;
    
    // Values that make sense for a clinical trial
    const created = Math.floor((3 + Math.random() * 5) * weekendFactor);
    const completed = Math.floor((2 + Math.random() * 5) * weekendFactor);
    
    result.push({
      date: date.toISOString().split('T')[0],
      completed,
      created
    });
  }
  
  return result;
}
