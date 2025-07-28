import { Warehouse } from '@/types';

const API_BASE = '/api/warehouses';

export const warehouseApi = {
  // Get all warehouses
  async getAll(): Promise<Warehouse[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error('Failed to fetch warehouses');
    }
    return response.json();
  },

  // Get single warehouse by ID
  async getById(id: string): Promise<Warehouse> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch warehouse');
    }
    return response.json();
  },

  // Get warehouses by filters
  async getByFilters(filters: {
    province?: string;
    district?: string;
    domain?: string;
    demography?: string;
    size?: string;
  }): Promise<Warehouse[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await fetch(`${API_BASE}?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch warehouses');
    }
    return response.json();
  },

  // Create new warehouse (for admin purposes)
  async create(warehouse: Omit<Warehouse, 'id'>): Promise<Warehouse> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(warehouse),
    });
    if (!response.ok) {
      throw new Error('Failed to create warehouse');
    }
    return response.json();
  },

  // Update warehouse
  async update(id: string, warehouse: Partial<Omit<Warehouse, 'id'>>): Promise<Warehouse> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(warehouse),
    });
    if (!response.ok) {
      throw new Error('Failed to update warehouse');
    }
    return response.json();
  },

  // Delete warehouse
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete warehouse');
    }
  }
}; 