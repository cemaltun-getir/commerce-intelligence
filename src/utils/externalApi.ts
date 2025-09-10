import { Product, Competitor, CompetitorPrice, Category, SubCategory } from '@/types';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';

export const externalApi = {
  // Get all products (SKUs) - via internal API proxy
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch('/api/external-products');
      
      if (!response.ok) {
        throw new Error(`Products API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  },

  // Get all vendors (competitors) - via internal API proxy
  async getVendors(): Promise<Competitor[]> {
    try {
      const response = await fetch('/api/external-competitors');
      
      if (!response.ok) {
        throw new Error(`Competitors API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching competitors:', error);
      throw new Error('Failed to fetch competitors');
    }
  },

  // Get all categories - via internal API proxy
  async getCategories(): Promise<Category[]> {
    try {
      const response = await fetch('/api/external-categories');
      
      if (!response.ok) {
        throw new Error(`Categories API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  },

  // Get all price mappings - via internal API proxy
  async getPriceMappings(): Promise<CompetitorPrice[]> {
    try {
      const response = await fetch('/api/external-price-mappings');
      
      if (!response.ok) {
        throw new Error(`Price mappings API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching price mappings:', error);
      throw new Error('Failed to fetch price mappings');
    }
  },

  // Get all sub-categories - via internal API proxy
  async getSubCategories(): Promise<SubCategory[]> {
    try {
      const response = await fetch('/api/external-categories');
      
      if (!response.ok) {
        throw new Error(`Categories API responded with status: ${response.status}`);
      }
      
      const categories = await response.json();
      // Extract sub-categories from categories
      const subCategories: SubCategory[] = [];
      categories.forEach((category: any) => {
        if (category.sub_categories) {
          subCategories.push(...category.sub_categories);
        }
      });
      return subCategories;
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      throw new Error('Failed to fetch sub-categories');
    }
  },

  // Get price mappings by filters - directly from external API
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
      console.error('Error fetching price mappings by filters from external API:', error);
      throw new Error('Failed to fetch price mappings by filters');
    }
  }
}; 