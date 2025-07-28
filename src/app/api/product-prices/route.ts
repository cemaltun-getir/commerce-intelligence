import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';

// Interface for calculated price data
interface CalculatedPrice {
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

// POST - Save calculated prices
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { prices }: { prices: CalculatedPrice[] } = await request.json();
    
    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      return NextResponse.json(
        { error: 'Invalid prices data' },
        { status: 400 }
      );
    }

    // Validate each price entry (now including location)
    for (const price of prices) {
      if (!price.productId || !price.segmentId || !price.competitorId || 
          price.calculatedPrice === undefined || price.competitorPrice === undefined ||
          !price.apiLocation) {
        return NextResponse.json(
          { error: 'Missing required price data fields (including apiLocation)' },
          { status: 400 }
        );
      }
    }

    // Here you would save to your database
    // For now, just simulate the save operation
    console.log(`Saving ${prices.length} calculated prices:`, prices);
    
    // Simulate database save
    const savedPrices = prices.map(price => ({
      ...price,
      id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      savedAt: new Date().toISOString()
    }));

    return NextResponse.json({
      message: `Successfully saved ${prices.length} calculated prices`,
      data: savedPrices
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving calculated prices:', error);
    return NextResponse.json(
      { error: 'Failed to save calculated prices' },
      { status: 500 }
    );
  }
}

// GET - Retrieve calculated prices (now location-aware)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const segmentId = searchParams.get('segmentId');
    const salesChannel = searchParams.get('salesChannel');
    const competitorId = searchParams.get('competitorId');
    const apiLocation = searchParams.get('apiLocation');
    
    // Here you would query your database with location filtering
    // For now, return mock data that varies by location
    console.log('Retrieving prices for:', { segmentId, salesChannel, competitorId, apiLocation });
    
    // Mock location-based pricing - prices vary by location
    const getLocationBasedPrice = (basePrice: number, location: string): number => {
      const locationMultipliers: Record<string, number> = {
        istanbul: 1.0,      // Base price
        ankara: 0.95,       // 5% lower
        izmir: 0.98,        // 2% lower  
        antalya: 1.02,      // 2% higher
        bursa: 0.97,        // 3% lower
        adana: 0.93,        // 7% lower
        gaziantep: 0.90,    // 10% lower
        konya: 0.92         // 8% lower
      };
      
      const multiplier = locationMultipliers[location || 'istanbul'] || 1.0;
      return Math.round(basePrice * multiplier * 100) / 100; // Round to 2 decimals
    };

    const baseCompetitorPrice = 21.0;
    const baseCalculatedPrice = 22.05;
    const locationBasedCompetitorPrice = getLocationBasedPrice(baseCompetitorPrice, apiLocation || 'istanbul');
    const locationBasedCalculatedPrice = getLocationBasedPrice(baseCalculatedPrice, apiLocation || 'istanbul');

    const mockPrices = [
      {
        id: 'price_123',
        productId: 'prd_64e23a1c5d9ef1204abcde1',
        segmentId: segmentId || 'segment_1',
        competitorId: competitorId || 'migros',
        competitorPrice: locationBasedCompetitorPrice,
        calculatedPrice: locationBasedCalculatedPrice,
        indexValue: 105,
        salesChannel: salesChannel || 'getir',
        apiLocation: apiLocation || 'istanbul',
        lastUpdated: new Date().toISOString()
      }
    ];

    return NextResponse.json(mockPrices);

  } catch (error) {
    console.error('Error retrieving calculated prices:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve calculated prices' },
      { status: 500 }
    );
  }
} 