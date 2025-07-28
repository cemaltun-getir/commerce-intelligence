import { IndexValue } from '@/types';

const API_BASE = '/api/index-values';

export const indexValueApi = {
  // Get all index values with optional filters
  async getAll(filters?: {
    segmentId?: string;
    salesChannel?: string;
    competitorId?: string;
  }): Promise<IndexValue[]> {
    const searchParams = new URLSearchParams();
    
    if (filters?.segmentId) searchParams.append('segmentId', filters.segmentId);
    if (filters?.salesChannel) searchParams.append('salesChannel', filters.salesChannel);
    if (filters?.competitorId) searchParams.append('competitorId', filters.competitorId);
    
    const url = searchParams.toString() ? `${API_BASE}?${searchParams}` : API_BASE;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch index values');
    }
    return response.json();
  },

  // Create or update index value
  async createOrUpdate(indexValue: IndexValue): Promise<IndexValue> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(indexValue),
    });
    if (!response.ok) {
      throw new Error('Failed to save index value');
    }
    return response.json();
  },

  // Delete index value
  async delete(
    segmentId: string,
    kviType: 'SKVI' | 'KVI' | 'Background' | 'Foreground',
    competitorId: string,
    salesChannel: 'getir' | 'getirbuyuk'
  ): Promise<void> {
    const searchParams = new URLSearchParams({
      segmentId,
      kviType,
      competitorId,
      salesChannel,
    });
    
    const response = await fetch(`${API_BASE}?${searchParams}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete index value');
    }
  },

  // Batch update multiple index values
  async batchUpdate(indexValues: IndexValue[]): Promise<IndexValue[]> {
    const results = await Promise.all(
      indexValues.map(iv => this.createOrUpdate(iv))
    );
    return results;
  },

  // Get index values for specific segment and sales channel
  async getBySegmentAndChannel(
    segmentId: string,
    salesChannel: 'getir' | 'getirbuyuk'
  ): Promise<IndexValue[]> {
    return this.getAll({ segmentId, salesChannel });
  },

  // Get index values for specific competitor and sales channel
  async getByCompetitorAndChannel(
    competitorId: string,
    salesChannel: 'getir' | 'getirbuyuk'
  ): Promise<IndexValue[]> {
    return this.getAll({ competitorId, salesChannel });
  }
}; 