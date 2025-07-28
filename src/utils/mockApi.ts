import { 
  Product, 
  Competitor, 
  CompetitorPrice, 
  Segment, 
  ProductMatch, 
  BoundaryRule,
  ApiResponse,
  Warehouse
} from '@/types';

// Mock data
export const mockCompetitors: Competitor[] = [
  { id: 'migros', name: 'migros', displayName: 'Migros' },
  { id: 'carrefour', name: 'carrefour', displayName: 'Carrefour' },
  { id: 'sok', name: 'sok', displayName: 'ŞOK' },
];

export const mockWarehouses: Warehouse[] = [
  {
    id: 'wh_001',
    name: 'Istanbul Kadikoy Hub',
    province: 'Istanbul',
    district: 'Kadikoy',
    region: 'Marmara',
    demography: 'Urban',
    size: 'Large',
    domain: 'Getir10'
  },
  {
    id: 'wh_002', 
    name: 'Istanbul Sisli Center',
    province: 'Istanbul',
    district: 'Sisli',
    region: 'Marmara',
    demography: 'Urban',
    size: 'Medium',
    domain: 'Getir10'
  },
  {
    id: 'wh_003',
    name: 'Ankara Cankaya Depot',
    province: 'Ankara',
    district: 'Cankaya',
    region: 'Central Anatolia',
    demography: 'Urban',
    size: 'Medium',
    domain: 'Getir30'
  },
  {
    id: 'wh_004',
    name: 'Izmir Konak Station',
    province: 'Izmir',
    district: 'Konak',
    region: 'Aegean',
    demography: 'Urban',
    size: 'Large',
    domain: 'Getir10'
  },
  {
    id: 'wh_005',
    name: 'Bursa Nilufer Facility',
    province: 'Bursa',
    district: 'Nilufer',
    region: 'Marmara',
    demography: 'Suburban',
    size: 'Small',
    domain: 'Getir30'
  },
  {
    id: 'wh_006',
    name: 'Antalya Kepez Hub',
    province: 'Antalya',
    district: 'Kepez',
    region: 'Mediterranean',
    demography: 'Urban',
    size: 'Medium',
    domain: 'Getir10'
  },
  {
    id: 'wh_007',
    name: 'Adana Seyhan Center',
    province: 'Adana',
    district: 'Seyhan',
    region: 'Mediterranean',
    demography: 'Urban',
    size: 'Large',
    domain: 'Getir30'
  },
  {
    id: 'wh_008',
    name: 'Gaziantep Sahinbey Depot',
    province: 'Gaziantep',
    district: 'Sahinbey',
    region: 'Southeastern Anatolia',
    demography: 'Suburban',
    size: 'Medium',
    domain: 'Getir10'
  },
  {
    id: 'wh_009',
    name: 'Kocaeli Izmit Station',
    province: 'Kocaeli',
    district: 'Izmit',
    region: 'Marmara',
    demography: 'Suburban',
    size: 'Small',
    domain: 'Getir30'
  },
  {
    id: 'wh_010',
    name: 'Mersin Akdeniz Hub',
    province: 'Mersin',
    district: 'Akdeniz',
    region: 'Mediterranean',
    demography: 'Urban',
    size: 'XLarge',
    domain: 'Getir10'
  },
  {
    id: 'wh_011',
    name: 'Eskisehir Tepebasi Center',
    province: 'Eskisehir',
    district: 'Tepebasi',
    region: 'Central Anatolia',
    demography: 'Suburban',
    size: 'Small',
    domain: 'Getir30'
  },
  {
    id: 'wh_012',
    name: 'Trabzon Ortahisar Facility',
    province: 'Trabzon',
    district: 'Ortahisar',
    region: 'Black Sea',
    demography: 'Urban',
    size: 'Medium',
    domain: 'Getir10'
  }
];

export const mockProducts: Product[] = [
  {
    id: '64e23a1c5d9ef1204abcde1',
    name: 'Soke Un (1 kg)',
    category: 'Basic Foods',
    subCategory: 'Flour & Grains',
    sku: 'SK001',
    getirUnitPrice: 23,
  },
  {
    id: '60b7c4f3af125812i9d3aa4',
    name: 'Coca Cola 330ml x2',
    category: 'Beverages',
    subCategory: 'Soft Drinks',
    sku: 'BV001',
    getirUnitPrice: 115,
  },
  {
    id: '62a7d6e4f2c34c1a80ea4f50',
    name: 'Tamek Domates Salçası',
    category: 'Canned Foods',
    subCategory: 'Tomato Products',
    sku: 'CF001',
    getirUnitPrice: 22,
  },
  {
    id: '5ebc1a09293ed4107f56bd90',
    name: 'Sütaş Beyaz Peynir',
    category: 'Dairy',
    subCategory: 'Cheese',
    sku: 'DR001',
    getirUnitPrice: 44,
  },
  {
    id: '6d59b871817d9c5ec3aab72',
    name: 'Soke Çavdar Unu (1 kg)',
    category: 'Basic Foods',
    subCategory: 'Flour & Grains',
    sku: 'SK002',
    getirUnitPrice: 25,
  },
  {
    id: '608bdb7280c9e0ef5d3986c4',
    name: 'Soke Çavdar Unu (2 kg)',
    category: 'Basic Foods',
    subCategory: 'Flour & Grains',
    sku: 'SK003',
    getirUnitPrice: 50,
  },
];

export const mockSegments: Segment[] = [
  {
    id: 'seg1',
    name: 'Istanbul Urban Hub',
    warehouseIds: ['wh_001', 'wh_002'],
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
    getirProductId: '64e23a1c5d9ef1204abcde1',
    getirProductName: 'Soke Un (1 kg)',
    competitorProductName: 'Soke Un 1kg',
    competitorId: 'sok',
    competitorPrice: 21,
    getirUnitPrice: 23,
    matchType: 'Matched',
    kviLabel: 95,
    ix: 95,
  },
  {
    getirProductId: '64e23a1c5d9ef1204abcde1',
    getirProductName: 'Soke Un (1 kg)',
    competitorProductName: 'Soke Un 1kg',
    competitorId: 'carrefour',
    competitorPrice: 21,
    getirUnitPrice: 23,
    matchType: 'Matched',
    kviLabel: 95,
    ix: 95,
  },
  {
    getirProductId: '60b7c4f3af125812i9d3aa4',
    getirProductName: 'Coca Cola 330ml x2',
    competitorProductName: 'Coca Cola 330ml x2',
    competitorId: 'sok',
    competitorPrice: 110,
    getirUnitPrice: 115,
    matchType: 'Indirect',
    kviLabel: 95,
    ix: 95,
  },
  {
    getirProductId: '60b7c4f3af125812i9d3aa4',
    getirProductName: 'Coca Cola 330ml x2',
    competitorProductName: 'Coca Cola 330ml x2',
    competitorId: 'carrefour',
    competitorPrice: 115,
    getirUnitPrice: 115,
    matchType: 'Indirect',
    kviLabel: 95,
    ix: 95,
  },
  {
    getirProductId: '62a7d6e4f2c34c1a80ea4f50',
    getirProductName: 'Tamek Domates Salçası',
    competitorProductName: '-',
    competitorId: 'carrefour',
    competitorPrice: 0,
    getirUnitPrice: 22,
    matchType: 'None',
    kviLabel: 90,
    ix: 90,
  },
  {
    getirProductId: '5ebc1a09293ed4107f56bd90',
    getirProductName: 'Sütaş Beyaz Peynir',
    competitorProductName: 'Sütaş Beyaz Peynir',
    competitorId: 'sok',
    competitorPrice: 40,
    getirUnitPrice: 44,
    matchType: 'Matched',
    kviLabel: 90,
    ix: 90,
  },
  {
    getirProductId: '5ebc1a09293ed4107f56bd90',
    getirProductName: 'Sütaş Beyaz Peynir',
    competitorProductName: 'Sütaş Beyaz Peynir',
    competitorId: 'carrefour',
    competitorPrice: 42,
    getirUnitPrice: 44,
    matchType: 'Matched',
    kviLabel: 90,
    ix: 90,
  },
];

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
  // Products
  async getProducts(): Promise<ApiResponse<Product[]>> {
    await delay(500);
    return {
      data: mockProducts,
      success: true,
      total: mockProducts.length,
    };
  },

  async getProductMatches(competitorId?: string): Promise<ApiResponse<ProductMatch[]>> {
    await delay(500);
    let filteredMatches = mockProductMatches;
    
    if (competitorId && competitorId !== 'all') {
      filteredMatches = mockProductMatches.filter(match => match.competitorId === competitorId);
    }

    return {
      data: filteredMatches,
      success: true,
      total: filteredMatches.length,
    };
  },

  // Competitors
  async getCompetitors(): Promise<ApiResponse<Competitor[]>> {
    await delay(300);
    return {
      data: mockCompetitors,
      success: true,
      total: mockCompetitors.length,
    };
  },

  // Segments
  async getSegments(): Promise<ApiResponse<Segment[]>> {
    await delay(500);
    return {
      data: mockSegments,
      success: true,
      total: mockSegments.length,
    };
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