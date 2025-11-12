import * as XLSX from 'xlsx';
import { ExportOptions } from '@/types';

// Apply special rounding logic for Getir prices (same as in IndexPage)
const applyGetirRounding = (price: number): number => {
  // Get integer and decimal parts
  const integerPart = Math.floor(price);
  const decimalPart = price - integerPart;
  
  // Apply special rounding logic for Getir prices
  if (decimalPart === 0) {
    // Keep whole numbers as is
    return Number(price.toFixed(2));
  } else if (decimalPart < 0.5) {
    // Round to x.5 for decimal values under x.5
    return integerPart + 0.5;
  } else {
    // Round to x.99 for decimal values over x.5 (including 0.5)
    return integerPart + 0.99;
  }
};

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
export const exportProductMatches = (
  data: Record<string, string | number>[], 
  format: 'csv' | 'xlsx',
  discountRates?: Record<string, number>
) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Check if any discount rates are set
  const hasDiscountRates = discountRates && Object.keys(discountRates).length > 0;

  // Define base headers
  const baseHeaders = [
    'Product ID',
    'Product Name', 
    'Segment ID',
    'Segment Name',
    'Competitor',
    'Category',
    'Sub Category',
    'KVI Type',
    'Index Value',
    'IX Price',
    'Competitor Price',
    'Discounted',
    'Competitor Discounted Price',
    'Discount %'
  ];

  // Always include discount columns if any discount rates exist
  const headers = hasDiscountRates 
    ? [...baseHeaders, 'Discount Rate (%)', 'Discounted Price']
    : baseHeaders;

  // Map the data to include all fields including segment data
  const exportData = data.map(item => {
    const baseData = {
      'Product ID': item.id || '',
      'Product Name': item.getirProductName || '',
      'Segment ID': item.segmentId || '',
      'Segment Name': item.segmentName || '',
      'Competitor': item.competitor || '',
      'Category': item.category || '',
      'Sub Category': item.subCategory || '',
      'KVI Type': item.kviType || '',
      'Index Value': item.ix || 0,
      'IX Price': item.getirUnitPrice || 0,
      'Competitor Price': item.competitorPrice || 0,
      'Discounted': item.isDiscounted ? 'Yes' : 'No',
      'Product Price (API)': item.price || '',
      'Competitor Discounted Price': item.struckPrice || '',
      'Discount %': item.struckPrice && item.competitorPrice ? 
        ((Number(item.struckPrice) - Number(item.competitorPrice)) / Number(item.struckPrice) * 100).toFixed(1) + '%' : ''
    };

    // Check if this specific product has a discount rate
    const productKey = item.key as string;
    const hasProductDiscountRate = discountRates && discountRates[productKey] !== undefined;

    if (hasDiscountRates && hasProductDiscountRate) {
      // This product has a discount rate - include discounted price
      const discountRate = discountRates[productKey];
      const getirPrice = item.getirUnitPrice as number || 0;
      
      // Only calculate discounted price if discount rate is greater than 0
      let struckPrice: string | number = '';
      if (discountRate > 0) {
        const rawStruckPrice = getirPrice * (1 - discountRate / 100);
        struckPrice = applyGetirRounding(rawStruckPrice);
      }
      
      return {
        ...baseData,
        'Discount Rate (%)': discountRate,
        'Discounted Price': struckPrice
      };
    } else if (hasDiscountRates) {
      // This product has no discount rate but other products do - include empty discount columns
      return {
        ...baseData,
        'Discount Rate (%)': '',
        'Discounted Price': ''
      };
    }

    return baseData;
  });

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