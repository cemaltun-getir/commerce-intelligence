const API_BASE = '/api/product-prices';

export interface CalculatedPrice {
  productId: string;
  segmentId: string;
  competitorId: string;
  competitorPrice: number;
  calculatedPrice: number;
  indexValue: number;
  salesChannel: 'getir' | 'getirbuyuk';
  lastUpdated: string;
}

export const productPriceApi = {
  // Save calculated prices in batch
  async saveBatch(prices: CalculatedPrice[]): Promise<CalculatedPrice[]> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prices }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save calculated prices');
    }
    
    const result = await response.json();
    return result.data;
  },

  // Get calculated prices with filters
  async getCalculatedPrices(filters?: {
    segmentId?: string;
    salesChannel?: string;
    competitorId?: string;
  }): Promise<CalculatedPrice[]> {
    const searchParams = new URLSearchParams();
    
    if (filters?.segmentId) searchParams.append('segmentId', filters.segmentId);
    if (filters?.salesChannel) searchParams.append('salesChannel', filters.salesChannel);
    if (filters?.competitorId) searchParams.append('competitorId', filters.competitorId);
    
    const url = searchParams.toString() ? `${API_BASE}?${searchParams}` : API_BASE;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch calculated prices');
    }
    return response.json();
  },

  // Get calculated price for specific product
  async getProductPrice(
    productId: string,
    segmentId: string,
    competitorId: string,
    salesChannel: 'getir' | 'getirbuyuk'
  ): Promise<CalculatedPrice | null> {
    const prices = await this.getCalculatedPrices({ segmentId, salesChannel, competitorId });
    return prices.find(p => p.productId === productId) || null;
  }
}; 