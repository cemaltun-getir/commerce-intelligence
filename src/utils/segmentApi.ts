import { Segment, PriceLocation } from '@/types';

const API_BASE = '/api/segments';

export const segmentApi = {
  // Get all segments
  async getAll(): Promise<Segment[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error('Failed to fetch segments');
    }
    return response.json();
  },

  // Get single segment by ID
  async getById(id: string): Promise<Segment> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch segment');
    }
    return response.json();
  },

  // Create new segment (now requires apiLocation)
  async create(segment: Omit<Segment, 'id' | 'lastUpdated'>): Promise<Segment> {
    // Validate that priceLocation is provided
    if (!segment.priceLocation) {
      throw new Error('Price location is required for segment creation');
    }

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(segment),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create segment' }));
      throw new Error(errorData.error || 'Failed to create segment');
    }
    return response.json();
  },

  // Update segment (can update apiLocation)
  async update(id: string, segment: Partial<Omit<Segment, 'id'>>): Promise<Segment> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(segment),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update segment' }));
      throw new Error(errorData.error || 'Failed to update segment');
    }
    return response.json();
  },

  // Delete segment
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete segment');
    }
  },

  // Get available price locations from external API
  async getPriceLocations(): Promise<PriceLocation[]> {
    try {
      const response = await fetch('http://localhost:3001/api/external/price-locations');
      
      if (!response.ok) {
        throw new Error(`External API responded with status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching price locations from external API:', error);
      throw new Error('Failed to fetch price locations');
    }
  }
}; 