import { WarehouseProductExpiry, WastePrice, WasteConfiguration, WastePriceFilter } from '@/types';

const API_BASE = '/api';

// External API proxy functions
export const wastePriceApi = {
  // Get warehouse product expiry data from external API
  async getWarehouseProductExpiry(): Promise<WarehouseProductExpiry[]> {
    try {
      const response = await fetch(`${API_BASE}/external-warehouse-product-expiry`);
      
      if (!response.ok) {
        throw new Error(`External API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching warehouse product expiry data:', error);
      throw new Error('Failed to fetch warehouse product expiry data');
    }
  },

  // Push confirmed waste price to external pricing system
  async applyWastePrice(data: {
    skuId: string;
    warehouseId: string;
    wastePrice: number;
    userId: string;
  }): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/external/waste-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku_id: data.skuId,
          warehouse_id: data.warehouseId,
          waste_price: data.wastePrice,
          user_id: data.userId,
          applied_at: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`External API responded with status: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Waste price applied successfully:', result);
    } catch (error) {
      console.error('Error applying waste price:', error);
      throw new Error('Failed to apply waste price');
    }
  },

  // Internal waste price CRUD operations
  async getWastePrices(filter?: WastePriceFilter): Promise<WastePrice[]> {
    try {
      let url = `${API_BASE}/waste-prices`;
      
      if (filter) {
        const params = new URLSearchParams();
        if (filter.search) params.append('search', filter.search);
        if (filter.warehouse?.length) params.append('warehouse', filter.warehouse.join(','));
        if (filter.category) params.append('category', filter.category);
        if (filter.minDays !== undefined) params.append('minDays', filter.minDays.toString());
        if (filter.maxDays !== undefined) params.append('maxDays', filter.maxDays.toString());
        if (filter.status) params.append('status', filter.status);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching waste prices:', error);
      throw new Error('Failed to fetch waste prices');
    }
  },

  async createWastePrice(wastePrice: Omit<WastePrice, '_id'>): Promise<WastePrice> {
    try {
      const response = await fetch(`${API_BASE}/waste-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wastePrice),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error creating waste price:', error);
      throw new Error('Failed to create waste price');
    }
  },

  async updateWastePrice(id: string, updates: Partial<WastePrice>): Promise<WastePrice> {
    try {
      const response = await fetch(`${API_BASE}/waste-prices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating waste price:', error);
      throw new Error('Failed to update waste price');
    }
  },

  async confirmWastePrice(id: string, confirmedPrice: number, userId: string, notes?: string): Promise<WastePrice> {
    try {
      const response = await fetch(`${API_BASE}/waste-prices/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmedPrice,
          userId,
          notes,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error confirming waste price:', error);
      throw new Error('Failed to confirm waste price');
    }
  },

  async rejectWastePrice(id: string, userId: string, notes?: string): Promise<WastePrice> {
    try {
      const response = await fetch(`${API_BASE}/waste-prices/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notes,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error rejecting waste price:', error);
      throw new Error('Failed to reject waste price');
    }
  },

  async bulkConfirmWastePrices(ids: string[], userId: string): Promise<WastePrice[]> {
    try {
      const response = await fetch(`${API_BASE}/waste-prices/bulk-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids,
          userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error bulk confirming waste prices:', error);
      throw new Error('Failed to bulk confirm waste prices');
    }
  },

  // Waste configuration operations
  async getWasteConfiguration(): Promise<WasteConfiguration> {
    try {
      const response = await fetch(`${API_BASE}/waste-configuration`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching waste configuration:', error);
      throw new Error('Failed to fetch waste configuration');
    }
  },

  async updateWasteConfiguration(configuration: WasteConfiguration, userId: string): Promise<WasteConfiguration> {
    try {
      const response = await fetch(`${API_BASE}/waste-configuration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...configuration,
          updatedBy: userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating waste configuration:', error);
      throw new Error('Failed to update waste configuration');
    }
  },

  // Generate waste prices for all expiring products
  async generateWastePrices(): Promise<WastePrice[]> {
    try {
      const response = await fetch(`${API_BASE}/waste-prices/generate`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error generating waste prices:', error);
      throw new Error('Failed to generate waste prices');
    }
  },
};
