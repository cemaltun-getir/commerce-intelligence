// Product and competitor data types
export interface Product {
  id: string;
  name: string;
  image?: string;
  brand: string;
  unit: string;
  unit_value: string;
  category_id: string;
  category_name: string;
  sub_category_id: string;
  sub_category_name: string;
  kvi_label: string;
  created_at: string;
  // New buying price fields from SKU API
  buying_price?: number;
  buying_vat?: number;
  buying_price_without_vat?: number;
  // New selling price fields from SKU API
  selling_price?: number;
  selling_vat?: number;
  selling_price_without_vat?: number;
}

export interface Competitor {
  id: string;
  name: string;
  logo?: string;
  created_at: string;
}

export interface CompetitorPrice {
  id: string;
  sku_id: string;
  vendor_id: string;
  location_id: string;
  price: number;
  struck_price: number | null;
  is_discounted: boolean;
  unit_price: number;
  currency: string;
  created_at: string;
  updated_at: string;
  sku_name: string;
  vendor_name: string;
  location_name: string;
  brand: string;
  unit: string;
  unit_value: string;
}

// Price Location types (for competitor pricing data)
export interface PriceLocation {
  id: string;
  name: string;
  created_at: string;
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
  apiLocation?: string; // Location where this price was fetched from
}

// Warehouse types
export interface Warehouse {
  id: string;
  name: string;
  province: string;
  district: string;
  region: string;
  demography: 'Upper Premium' | 'Premium' | 'Upper Medium' | 'Medium' | 'Lower Medium' | 'Mass';
  size: 'Micro' | 'Mini' | 'Midi' | 'Maxi' | 'GB Midi' | 'GB Maxi';
  domains: ('Getir' | 'Getir Büyük' | 'Getir Express' | 'Getir Market')[];
}

// Segmentation types
export interface Segment {
  id: string;
  name: string;
  warehouseIds: string[];
  priceLocation: string; // Mandatory: Location for fetching competitor prices via API
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
  discounted?: 'all' | 'discounted' | 'not-discounted';
  salesChannel?: 'getir' | 'getirbuyuk';
}

export interface SegmentFilter {
  search?: string;
  domain?: 'Getir' | 'Getir Büyük' | 'all';
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

export interface Category {
  id: string;
  name: string;
  created_at: string;
  skus_count: number;
  children?: Category[];
}

export interface SubCategory {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  created_at: string;
  skus_count: number;
} 