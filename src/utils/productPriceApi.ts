const API_BASE = '/api/product-prices';

export interface CalculatedPrice {
  productId: string;
  segmentId: string;
  competitorId: string;
  competitorPrice: number;
  calculatedPrice: number;
  indexValue: number;
  salesChannel: 'getir' | 'getirbuyuk';
  apiLocation: string; // Location where the competitor price was fetched from
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

  // Get calculated prices with filters (now includes location)
  async getCalculatedPrices(filters?: {
    segmentId?: string;
    salesChannel?: string;
    competitorId?: string;
    apiLocation?: string;
  }): Promise<CalculatedPrice[]> {
    const searchParams = new URLSearchParams();
    
    if (filters?.segmentId) searchParams.append('segmentId', filters.segmentId);
    if (filters?.salesChannel) searchParams.append('salesChannel', filters.salesChannel);
    if (filters?.competitorId) searchParams.append('competitorId', filters.competitorId);
    if (filters?.apiLocation) searchParams.append('apiLocation', filters.apiLocation);
    
    const url = searchParams.toString() ? `${API_BASE}?${searchParams}` : API_BASE;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch calculated prices');
    }
    return response.json();
  },

  // Get calculated price for specific product (now location-aware)
  async getProductPrice(
    productId: string,
    segmentId: string,
    competitorId: string,
    salesChannel: 'getir' | 'getirbuyuk',
    apiLocation: string
  ): Promise<CalculatedPrice | null> {
    const prices = await this.getCalculatedPrices({ 
      segmentId, 
      salesChannel, 
      competitorId, 
      apiLocation 
    });
    return prices.find(p => p.productId === productId) || null;
  },

  // Get prices for segment's location (convenience method)
  async getPricesForSegmentLocation(
    segmentId: string,
    apiLocation: string,
    salesChannel?: 'getir' | 'getirbuyuk',
    competitorId?: string
  ): Promise<CalculatedPrice[]> {
    return this.getCalculatedPrices({
      segmentId,
      apiLocation,
      salesChannel,
      competitorId
    });
  }
}; 