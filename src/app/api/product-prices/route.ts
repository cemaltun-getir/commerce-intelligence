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

    // Validate each price entry
    for (const price of prices) {
      if (!price.productId || !price.segmentId || !price.competitorId || 
          price.calculatedPrice === undefined || price.competitorPrice === undefined) {
        return NextResponse.json(
          { error: 'Missing required price data fields' },
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

// GET - Retrieve calculated prices
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const segmentId = searchParams.get('segmentId');
    const salesChannel = searchParams.get('salesChannel');
    const competitorId = searchParams.get('competitorId');
    
    // Here you would query your database
    // For now, return mock data
    console.log('Retrieving prices for:', { segmentId, salesChannel, competitorId });
    
    const mockPrices = [
      {
        id: 'price_123',
        productId: 'prd_64e23a1c5d9ef1204abcde1',
        segmentId: segmentId || 'segment_1',
        competitorId: competitorId || 'migros',
        competitorPrice: 21.0,
        calculatedPrice: 22.05,
        indexValue: 105,
        salesChannel: salesChannel || 'getir',
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