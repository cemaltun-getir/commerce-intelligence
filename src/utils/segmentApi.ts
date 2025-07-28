import { Segment } from '@/types';

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

  // Create new segment
  async create(segment: Omit<Segment, 'id' | 'lastUpdated'>): Promise<Segment> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(segment),
    });
    if (!response.ok) {
      throw new Error('Failed to create segment');
    }
    return response.json();
  },

  // Update segment
  async update(id: string, segment: Partial<Omit<Segment, 'id'>>): Promise<Segment> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(segment),
    });
    if (!response.ok) {
      throw new Error('Failed to update segment');
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
  }
}; 