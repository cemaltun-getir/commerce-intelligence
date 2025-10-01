import { Product, Competitor, CompetitorPrice, Category, SubCategory, Warehouse } from '@/types';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';

// External warehouse format from API
interface ExternalWarehouse {
  id: string;
  name: string;
  city: string;
  region: string;
  demography: string;
  size: string;
  domains: string[];
}

// Transform external warehouse format to internal format
export const transformExternalWarehouse = (externalWarehouse: ExternalWarehouse): Warehouse => ({
  id: externalWarehouse.id,
  name: externalWarehouse.name,
  province: externalWarehouse.city, // Map city to province
  district: externalWarehouse.region, // Map region to district
  region: externalWarehouse.region,
  demography: externalWarehouse.demography as Warehouse['demography'],
  size: externalWarehouse.size as Warehouse['size'],
  domains: externalWarehouse.domains as Warehouse['domains']
});

export const externalApi = {
  // Get all products (SKUs) - via internal API proxy
  async getProducts(categoryFilters?: {
    category_level1_id?: string;
    category_level2_id?: string;
    category_level3_id?: string;
    category_level4_id?: string;
  }): Promise<Product[]> {
    try {
      let url = '/api/external-products';
      
      // Add category filter parameters if provided
      if (categoryFilters) {
        const params = new URLSearchParams();
        if (categoryFilters.category_level1_id) params.append('category_level1_id', categoryFilters.category_level1_id);
        if (categoryFilters.category_level2_id) params.append('category_level2_id', categoryFilters.category_level2_id);
        if (categoryFilters.category_level3_id) params.append('category_level3_id', categoryFilters.category_level3_id);
        if (categoryFilters.category_level4_id) params.append('category_level4_id', categoryFilters.category_level4_id);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await fetch(url);
      
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

  // Flatten hierarchical categories into a flat list with level information
  flattenCategories(categories: Category[], level: number = 0, parentPath: string = ''): Array<Category & { level: number; path: string; fullPath: string }> {
    const flattened: Array<Category & { level: number; path: string; fullPath: string }> = [];
    
    categories.forEach(category => {
      const currentPath = parentPath ? `${parentPath} > ${category.name}` : category.name;
      const fullPath = currentPath;
      
      flattened.push({
        ...category,
        level,
        path: category.name,
        fullPath
      });
      
      if (category.children && category.children.length > 0) {
        flattened.push(...this.flattenCategories(category.children, level + 1, currentPath));
      }
    });
    
    return flattened;
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

  // Get all warehouses - via internal API proxy
  async getWarehouses(): Promise<Warehouse[]> {
    try {
      const response = await fetch('/api/external-warehouses');
      
      if (!response.ok) {
        throw new Error(`Warehouses API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw new Error('Failed to fetch warehouses');
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