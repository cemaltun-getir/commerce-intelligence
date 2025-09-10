import { Product, Competitor, CompetitorPrice, Category, SubCategory } from '@/types';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';

export const externalApi = {
  // Get all products (SKUs)
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE}/skus`);
      
      if (!response.ok) {
        throw new Error(`External API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching products from external API:', error);
      throw new Error('Failed to fetch products');
    }
  },

  // Get all vendors (competitors)
  async getVendors(): Promise<Competitor[]> {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE}/vendors`);
      
      if (!response.ok) {
        throw new Error(`External API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching vendors from external API:', error);
      throw new Error('Failed to fetch vendors');
    }
  },

  // Get all price mappings
  async getPriceMappings(): Promise<CompetitorPrice[]> {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE}/price-mappings`);
      
      if (!response.ok) {
        throw new Error(`External API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching price mappings from external API:', error);
      throw new Error('Failed to fetch price mappings');
    }
  },

  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE}/categories`);
      
      if (!response.ok) {
        throw new Error(`External API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching categories from external API:', error);
      throw new Error('Failed to fetch categories');
    }
  },

  // Get all sub-categories
  async getSubCategories(): Promise<SubCategory[]> {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE}/sub-categories`);
      
      if (!response.ok) {
        throw new Error(`External API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching sub-categories from external API:', error);
      throw new Error('Failed to fetch sub-categories');
    }
  },

  // Get price mappings by filters
  async getPriceMappingsByFilters(filters: {
    sku_id?: string;
    vendor_id?: string;
    location_id?: string;
  }): Promise<CompetitorPrice[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`${EXTERNAL_API_BASE}/price-mappings?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`External API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching price mappings from external API:', error);
      throw new Error('Failed to fetch price mappings');
    }
  }
}; 