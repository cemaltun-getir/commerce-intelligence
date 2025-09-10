import { 
  Product, 
  Competitor, 
  CompetitorPrice, 
  Segment, 
  ProductMatch, 
  BoundaryRule,
  ApiResponse,
  Warehouse,
  PriceLocation
} from '@/types';

// Mock data
export const mockCompetitors: Competitor[] = [
  { id: 'migros', name: 'migros', created_at: '2024-01-01T00:00:00Z' },
  { id: 'carrefour', name: 'carrefour', created_at: '2024-01-01T00:00:00Z' },
  { id: 'sok', name: 'sok', created_at: '2024-01-01T00:00:00Z' },
];

// Mock API locations where competitor pricing data is available
export const mockApiLocations: PriceLocation[] = [
  {
    id: 'istanbul',
    name: 'istanbul',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'ankara',
    name: 'ankara', 
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'izmir',
    name: 'izmir',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'antalya',
    name: 'antalya',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'bursa',
    name: 'bursa',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'adana',
    name: 'adana',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'gaziantep',
    name: 'gaziantep',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'konya',
    name: 'konya',
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const mockWarehouses: Warehouse[] = [
  {
    id: 'wh_001',
    name: 'Istanbul Kadikoy Hub',
    province: 'Istanbul',
    district: 'Kadikoy',
    region: 'Marmara',
    demography: 'Premium',
    size: 'Maxi',
    domain: 'Getir'
  },
  {
    id: 'wh_002', 
    name: 'Istanbul Sisli Center',
    province: 'Istanbul',
    district: 'Sisli',
    region: 'Marmara',
    demography: 'Premium',
    size: 'Midi',
    domain: 'Getir'
  },
  {
    id: 'wh_003',
    name: 'Ankara Cankaya Depot',
    province: 'Ankara',
    district: 'Cankaya',
    region: 'Central Anatolia',
    demography: 'Premium',
    size: 'Midi',
    domain: 'Getir'
  },
  {
    id: 'wh_004',
    name: 'Izmir Konak Station',
    province: 'Izmir',
    district: 'Konak',
    region: 'Aegean',
    demography: 'Premium',
    size: 'Maxi',
    domain: 'Getir'
  },
  {
    id: 'wh_005',
    name: 'Bursa Nilufer Facility',
    province: 'Bursa',
    district: 'Nilufer',
    region: 'Marmara',
    demography: 'Medium',
    size: 'Mini',
    domain: 'Getir'
  },
  {
    id: 'wh_006',
    name: 'Antalya Kepez Hub',
    province: 'Antalya',
    district: 'Kepez',
    region: 'Mediterranean',
    demography: 'Premium',
    size: 'Midi',
    domain: 'Getir'
  },
  {
    id: 'wh_007',
    name: 'Adana Seyhan Center',
    province: 'Adana',
    district: 'Seyhan',
    region: 'Mediterranean',
    demography: 'Premium',
    size: 'Maxi',
    domain: 'Getir'
  },
  {
    id: 'wh_008',
    name: 'Gaziantep Sahinbey Depot',
    province: 'Gaziantep',
    district: 'Sahinbey',
    region: 'Southeastern Anatolia',
    demography: 'Medium',
    size: 'Midi',
    domain: 'Getir'
  },
  {
    id: 'wh_009',
    name: 'Kocaeli Izmit Station',
    province: 'Kocaeli',
    district: 'Izmit',
    region: 'Marmara',
    demography: 'Medium',
    size: 'Mini',
    domain: 'Getir'
  },
  {
    id: 'wh_010',
    name: 'Mersin Akdeniz Hub',
    province: 'Mersin',
    district: 'Akdeniz',
    region: 'Mediterranean',
    demography: 'Premium',
    size: 'GB Maxi',
    domain: 'Getir'
  },
  {
    id: 'wh_011',
    name: 'Eskisehir Tepebasi Center',
    province: 'Eskisehir',
    district: 'Tepebasi',
    region: 'Central Anatolia',
    demography: 'Medium',
    size: 'Mini',
    domain: 'Getir'
  },
  {
    id: 'wh_012',
    name: 'Trabzon Ortahisar Facility',
    province: 'Trabzon',
    district: 'Ortahisar',
    region: 'Black Sea',
    demography: 'Premium',
    size: 'Midi',
    domain: 'Getir'
  }
];

// Helper function to get warehouses by IDs
const getWarehousesByIds = (ids: string[]): Warehouse[] => {
  return mockWarehouses.filter(warehouse => ids.includes(warehouse.id));
};

export const mockProducts: Product[] = [
  {
    id: '64e23a1c5d9ef1204abcde1',
    name: 'Soke Un (1 kg)',
    brand: 'Soke',
    unit: 'kg',
    unit_value: '1',
    category_id: 'cat1',
    category_name: 'Basic Foods',
    sub_category_id: 'subcat1',
    sub_category_name: 'Flour & Grains',
    kvi_label: 'SKVI',
    created_at: '2024-01-01T00:00:00Z',
    buying_price: 15.99,
    buying_vat: 20.0,
    buying_price_without_vat: 13.33,
  },
  {
    id: '60b7c4f3af125812i9d3aa4',
    name: 'Coca Cola 330ml x2',
    brand: 'Coca Cola',
    unit: 'ml',
    unit_value: '660',
    category_id: 'cat2',
    category_name: 'Beverages',
    sub_category_id: 'subcat2',
    sub_category_name: 'Soft Drinks',
    kvi_label: 'KVI',
    created_at: '2024-01-01T00:00:00Z',
    buying_price: 89.99,
    buying_vat: 20.0,
    buying_price_without_vat: 74.99,
  },
  {
    id: '62a7d6e4f2c34c1a80ea4f50',
    name: 'Tamek Domates Salçası',
    brand: 'Tamek',
    unit: 'g',
    unit_value: '850',
    category_id: 'cat3',
    category_name: 'Canned Foods',
    sub_category_id: 'subcat3',
    sub_category_name: 'Tomato Products',
    kvi_label: 'Foreground',
    created_at: '2024-01-01T00:00:00Z',
    buying_price: 14.50,
    buying_vat: 20.0,
    buying_price_without_vat: 12.08,
  },
  {
    id: '5ebc1a09293ed4107f56bd90',
    name: 'Sütaş Beyaz Peynir',
    brand: 'Sütaş',
    unit: 'g',
    unit_value: '500',
    category_id: 'cat4',
    category_name: 'Dairy',
    sub_category_id: 'subcat4',
    sub_category_name: 'Cheese',
    kvi_label: 'Background',
    created_at: '2024-01-01T00:00:00Z',
    buying_price: 32.99,
    buying_vat: 20.0,
    buying_price_without_vat: 27.49,
  },
  {
    id: '6d59b871817d9c5ec3aab72',
    name: 'Soke Çavdar Unu (1 kg)',
    brand: 'Soke',
    unit: 'kg',
    unit_value: '1',
    category_id: 'cat1',
    category_name: 'Basic Foods',
    sub_category_id: 'subcat1',
    sub_category_name: 'Flour & Grains',
    kvi_label: 'SKVI',
    created_at: '2024-01-01T00:00:00Z',
    buying_price: 18.75,
    buying_vat: 20.0,
    buying_price_without_vat: 15.63,
  },
  {
    id: '608bdb7280c9e0ef5d3986c4',
    name: 'Soke Çavdar Unu (2 kg)',
    brand: 'Soke',
    unit: 'kg',
    unit_value: '2',
    category_id: 'cat1',
    category_name: 'Basic Foods',
    sub_category_id: 'subcat1',
    sub_category_name: 'Flour & Grains',
    kvi_label: 'SKVI',
    created_at: '2024-01-01T00:00:00Z',
    buying_price: 37.50,
    buying_vat: 20.0,
    buying_price_without_vat: 31.25,
  },
];

export const mockSegments: Segment[] = [
  {
    id: 'seg1',
    name: 'Istanbul Urban Hub',
    warehouseIds: ['wh_001', 'wh_002'],
    apiLocation: 'istanbul',
    lastUpdated: '2025-10-05T08:20:00Z',
    domains: ['Getir10'],
    provinces: ['Istanbul'],
    districts: ['Kadikoy', 'Sisli'],
    regions: ['Marmara'],
    demographies: ['Urban'],
    sizes: ['Large', 'Medium']
  },
  {
    id: 'seg2',
    name: 'Ankara Central',
    warehouseIds: ['wh_003'],
    apiLocation: 'ankara',
    lastUpdated: '2025-10-03T11:45:00Z',
    domains: ['Getir30'],
    provinces: ['Ankara'],
    districts: ['Cankaya'],
    regions: ['Central Anatolia'],
    demographies: ['Urban'],
    sizes: ['Medium']
  },
  {
    id: 'seg3',
    name: 'Aegean Coast',
    warehouseIds: ['wh_004'],
    apiLocation: 'izmir',
    lastUpdated: '2025-10-04T16:00:00Z',
    domains: ['Getir10'],
    provinces: ['Izmir'],
    districts: ['Konak'],
    regions: ['Aegean'],
    demographies: ['Urban'],
    sizes: ['Large']
  },
  {
    id: 'seg4',
    name: 'Mixed Regional Network',
    warehouseIds: ['wh_005', 'wh_008', 'wh_009'],
    apiLocation: 'bursa',
    lastUpdated: '2025-10-02T09:15:00Z',
    domains: ['Getir30', 'Getir10'],
    provinces: ['Bursa', 'Gaziantep', 'Kocaeli'],
    districts: ['Nilufer', 'Sahinbey', 'Izmit'],
    regions: ['Marmara', 'Southeastern Anatolia'],
    demographies: ['Suburban'],
    sizes: ['Small', 'Medium']
  },
];

export const mockProductMatches: ProductMatch[] = [
  {
    id: 'match_1',
    getirProductId: '64e23a1c5d9ef1204abcde1',
    getirProductName: 'Soke Un (1 kg)',
    competitorId: 'sok',
    competitorPrice: 21,
    getirUnitPrice: 23,
    kviLabel: 95,
    ix: 95,
    category: 'Basic Foods',
    subCategory: 'Flour & Grains'
  },
  {
    id: 'match_2',
    getirProductId: '64e23a1c5d9ef1204abcde1',
    getirProductName: 'Soke Un (1 kg)',
    competitorId: 'carrefour',
    competitorPrice: 21,
    getirUnitPrice: 23,
    kviLabel: 95,
    ix: 95,
    category: 'Basic Foods',
    subCategory: 'Flour & Grains'
  },
  {
    id: 'match_3',
    getirProductId: '60b7c4f3af125812i9d3aa4',
    getirProductName: 'Coca Cola 330ml x2',
    competitorId: 'sok',
    competitorPrice: 110,
    getirUnitPrice: 115,
    kviLabel: 95,
    ix: 95,
    category: 'Beverages',
    subCategory: 'Soft Drinks'
  },
  {
    id: 'match_4',
    getirProductId: '60b7c4f3af125812i9d3aa4',
    getirProductName: 'Coca Cola 330ml x2',
    competitorId: 'carrefour',
    competitorPrice: 115,
    getirUnitPrice: 115,
    kviLabel: 95,
    ix: 95,
    category: 'Beverages',
    subCategory: 'Soft Drinks'
  },
  {
    id: 'match_5',
    getirProductId: '62a7d6e4f2c34c1a80ea4f50',
    getirProductName: 'Tamek Domates Salçası',
    competitorId: 'carrefour',
    competitorPrice: 0,
    getirUnitPrice: 22,
    kviLabel: 90,
    ix: 90,
    category: 'Basic Foods',
    subCategory: 'Canned & Jarred'
  },
  {
    id: 'match_6',
    getirProductId: '5ebc1a09293ed4107f56bd90',
    getirProductName: 'Sütaş Beyaz Peynir',
    competitorId: 'sok',
    competitorPrice: 40,
    getirUnitPrice: 44,
    kviLabel: 90,
    ix: 90,
    category: 'Dairy',
    subCategory: 'Cheese'
  },
  {
    id: 'match_7',
    getirProductId: '5ebc1a09293ed4107f56bd90',
    getirProductName: 'Sütaş Beyaz Peynir',
    competitorId: 'carrefour',
    competitorPrice: 42,
    getirUnitPrice: 44,
    kviLabel: 90,
    ix: 90,
    category: 'Dairy',
    subCategory: 'Cheese'
  }
];

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
  // Get all segments with populated warehouse data  
  async getSegments(): Promise<Segment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockSegments.map(segment => ({
      ...segment,
      warehouses: getWarehousesByIds(segment.warehouseIds)
    }));
  },

  // Get single segment by ID
  async getSegmentById(id: string): Promise<Segment | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const segment = mockSegments.find(s => s.id === id);
    if (!segment) return null;
    
    return {
      ...segment,
      warehouses: getWarehousesByIds(segment.warehouseIds)
    };
  },

  // Get all API locations
  async getApiLocations(): Promise<PriceLocation[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockApiLocations;
  },

  // Get all warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockWarehouses;
  },

  // Get warehouses by IDs
  async getWarehousesByIds(ids: string[]): Promise<Warehouse[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return getWarehousesByIds(ids);
  },

  // Get all competitors
  async getCompetitors(): Promise<Competitor[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return mockCompetitors;
  },

  // Get all products
  async getProducts(): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockProducts;
  },

  // Get product matches
  async getProductMatches(): Promise<ProductMatch[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockProductMatches;
  },

  async createSegment(segment: Omit<Segment, 'id'>): Promise<ApiResponse<Segment>> {
    await delay(800);
    const newSegment: Segment = {
      ...segment,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString(),
    };
    
    return {
      data: newSegment,
      success: true,
      message: 'Segment created successfully',
    };
  },

  async updateSegment(id: string, segment: Partial<Segment>): Promise<ApiResponse<Segment>> {
    await delay(600);
    const updatedSegment: Segment = {
      ...mockSegments.find(s => s.id === id)!,
      ...segment,
      lastUpdated: new Date().toISOString(),
    };
    
    return {
      data: updatedSegment,
      success: true,
      message: 'Segment updated successfully',
    };
  },

  async deleteSegment(id: string): Promise<ApiResponse<null>> {
    await delay(400);
    return {
      data: null,
      success: true,
      message: 'Segment deleted successfully',
    };
  },

  // Export
  async exportData(format: 'csv' | 'xlsx', data: any[]): Promise<ApiResponse<string>> {
    await delay(1000);
    return {
      data: `export_${Date.now()}.${format}`,
      success: true,
      message: `Data exported successfully as ${format.toUpperCase()}`,
    };
  },
}; 