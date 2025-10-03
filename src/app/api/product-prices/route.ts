import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';





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
    
    // Mock data - prices are already location-specific from external API
    const baseCompetitorPrice = 21.0;
    const baseCalculatedPrice = 22.05;

    const mockPrices = [
      {
        id: 'price_123',
        productId: 'prd_64e23a1c5d9ef1204abcde1',
        segmentId: segmentId || 'segment_1',
        competitorId: competitorId || 'migros',
        competitorPrice: baseCompetitorPrice,
        calculatedPrice: baseCalculatedPrice,
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