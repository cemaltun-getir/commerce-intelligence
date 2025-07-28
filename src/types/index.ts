// Product and competitor data types
export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  sku: string;
  getirUnitPrice: number;
  recommendedRetailPrice?: number;
}

export interface Competitor {
  id: string;
  name: string;
  displayName: string;
  logo?: string;
}

export interface CompetitorPrice {
  id: string;
  productId: string;
  competitorId: string;
  price: number;
  lastUpdated: string;
  matchType: 'Matched' | 'Indirect' | 'None';
  kviLabel: number;
}

export interface ProductMatch {
  id: string;
  getirProductId: string;
  getirProductName: string;
  competitorId: string;
  competitorPrice: number; // From API - varies by competitor
  getirUnitPrice?: number; // Calculated using IX value - can be saved to DB
  kviLabel: number; // Internal Getir classification - same for product across all competitors
  ix: number;
  category: string;
  subCategory: string;
  segmentId?: string; // Which segment this product belongs to
  lastPriceUpdate?: string; // When the calculated price was last updated
}

// Warehouse types
export interface Warehouse {
  id: string;
  name: string;
  province: string;
  district: string;
  region: string;
  demography: 'Urban' | 'Suburban' | 'Rural';
  size: 'Small' | 'Medium' | 'Large' | 'XLarge';
  domain: 'Getir10' | 'Getir30';
}

// Segmentation types
export interface Segment {
  id: string;
  name: string;
  warehouseIds: string[];
  warehouses?: Warehouse[]; // Populated warehouse data
  lastUpdated: string;
  // Computed from warehouses
  domains?: string[];
  provinces?: string[];
  districts?: string[];
  regions?: string[];
  demographies?: string[];
  sizes?: string[];
}

// Index matrix types
export interface IndexValue {
  segmentId: string;
  kviType: 'SKVI' | 'KVI' | 'Background' | 'Foreground';
  value: number;
  competitorId: string;
  salesChannel: 'getir' | 'getirbuyuk';
}

// Boundary rules types
export interface BoundaryRule {
  id: string;
  name: string;
  minPrice?: number;
  maxPrice?: number;
  minMargin?: number;
  maxMargin?: number;
  category?: string;
  subCategory?: string;
  competitor?: string;
  salesChannel: 'getir' | 'getirbuyuk';
  isActive: boolean;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

// Filter and search types
export interface ProductFilter {
  search?: string;
  category?: string;
  subCategory?: string;
  competitor?: string;
  salesChannel?: 'getir' | 'getirbuyuk';
}

export interface SegmentFilter {
  search?: string;
  domain?: 'Getir10' | 'Getir30' | 'all';
  province?: string;
  district?: string;
  region?: string;
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'xlsx';
  includeHeaders: boolean;
  selectedColumns?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
} 