import * as XLSX from 'xlsx';
import { ExportOptions } from '@/types';

// Export data to CSV format
export const exportToCSV = (data: any[], filename: string, options?: ExportOptions) => {
  const headers = options?.selectedColumns || Object.keys(data[0] || {});
  
  // Create CSV content
  const csvContent = [
    // Headers
    options?.includeHeaders !== false ? headers.join(',') : null,
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas, quotes, or newlines
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].filter(row => row !== null).join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Export data to Excel format
export const exportToExcel = (data: any[], filename: string, options?: ExportOptions) => {
  const headers = options?.selectedColumns || Object.keys(data[0] || {});
  
  // Prepare data for Excel
  const worksheetData = [
    // Headers
    options?.includeHeaders !== false ? headers : null,
    // Data rows
    ...data.map(row => headers.map(header => row[header] || ''))
  ].filter(row => row !== null);

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-size columns
  const columnWidths = headers.map(header => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => String(row[header] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) }; // Max width of 50 characters
  });
  ws['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // Save file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Export product matches data
export const exportProductMatches = (data: Record<string, string | number>[], format: 'csv' | 'xlsx') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Define all the fields we want to export - now including segment information
  const headers = [
    'Product ID',
    'Product Name', 
    'Segment ID',
    'Segment Name',
    'Competitor',
    'Category',
    'Sub Category',
    'KVI Type',
    'Index Value',
    'Getir Unit Price',
    'Competitor Price'
  ];

  // Map the data to include all fields including segment data
  const exportData = data.map(item => ({
    'Product ID': item.id || '',
    'Product Name': item.getirProductName || '',
    'Segment ID': item.segmentId || '',
    'Segment Name': item.segmentName || '',
    'Competitor': item.competitor || '',
    'Category': item.category || '',
    'Sub Category': item.subCategory || '',
    'KVI Type': item.kviType || '',
    'Index Value': item.ix || 0,
    'Getir Unit Price': item.getirUnitPrice || 0,
    'Competitor Price': item.competitorPrice || 0
  }));

  if (format === 'csv') {
    exportToCSV(exportData, 'product-matches');
  } else {
    exportToExcel(exportData, 'product-matches');
  }
};

// Export segments data
export const exportSegments = (data: any[], format: 'csv' | 'xlsx' = 'csv') => {
  const filename = `segments_${new Date().toISOString().split('T')[0]}`;
  const options: ExportOptions = {
    format,
    includeHeaders: true,
    selectedColumns: [
      'segment',
      'domain',
      'warehouseCount',
      'lastUpdated'
    ]
  };

  if (format === 'csv') {
    exportToCSV(data, filename, options);
  } else {
    exportToExcel(data, filename, options);
  }
};

// Export boundary rules data
export const exportBoundaryRules = (data: any[], format: 'csv' | 'xlsx' = 'csv') => {
  const filename = `boundary_rules_${new Date().toISOString().split('T')[0]}`;
  const options: ExportOptions = {
    format,
    includeHeaders: true,
    selectedColumns: [
      'name',
      'minPrice',
      'maxPrice',
      'minMargin',
      'maxMargin',
      'category',
      'subCategory',
      'competitor',
      'salesChannel',
      'isActive'
    ]
  };

  if (format === 'csv') {
    exportToCSV(data, filename, options);
  } else {
    exportToExcel(data, filename, options);
  }
};

// Generic export function
export const exportData = (
  data: any[], 
  filename: string, 
  format: 'csv' | 'xlsx' = 'csv',
  options?: ExportOptions
) => {
  if (format === 'csv') {
    exportToCSV(data, filename, options);
  } else {
    exportToExcel(data, filename, options);
  }
}; 