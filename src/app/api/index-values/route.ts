import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import IndexValue from '@/models/IndexValue';
import { IndexValue as IndexValueType } from '@/types';

// GET all index values
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const segmentId = searchParams.get('segmentId');
    const salesChannel = searchParams.get('salesChannel');
    const competitorId = searchParams.get('competitorId');
    
    // Build filter object
    const filter: Record<string, string> = {};
    if (segmentId) filter.segmentId = segmentId;
    if (salesChannel) filter.salesChannel = salesChannel;
    if (competitorId) filter.competitorId = competitorId;
    
    const indexValues = await IndexValue.find(filter).sort({ lastUpdated: -1 });
    
    const formattedIndexValues: IndexValueType[] = indexValues.map(iv => ({
      segmentId: iv.segmentId,
      kviType: iv.kviType,
      value: iv.value,
      competitorId: iv.competitorId,
      salesChannel: iv.salesChannel,
    }));
    
    return NextResponse.json(formattedIndexValues);
  } catch (error) {
    console.error('Error fetching index values:', error);
    return NextResponse.json(
      { error: 'Failed to fetch index values' },
      { status: 500 }
    );
  }
}

// POST new index value or update existing
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { segmentId, kviType, value, competitorId, salesChannel } = body;
    
    // Validate required fields
    if (!segmentId || !kviType || value === undefined || !competitorId || !salesChannel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate value range
    if (value < 0 || value > 100) {
      return NextResponse.json(
        { error: 'Value must be between 0 and 100' },
        { status: 400 }
      );
    }
    
    // Use findOneAndUpdate with upsert to create or update
    const indexValue = await IndexValue.findOneAndUpdate(
      {
        segmentId,
        kviType,
        competitorId,
        salesChannel
      },
      {
        value,
        lastUpdated: new Date()
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );
    
    const formattedIndexValue: IndexValueType = {
      segmentId: indexValue.segmentId,
      kviType: indexValue.kviType,
      value: indexValue.value,
      competitorId: indexValue.competitorId,
      salesChannel: indexValue.salesChannel,
    };
    
    return NextResponse.json(formattedIndexValue, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating index value:', error);
    return NextResponse.json(
      { error: 'Failed to save index value' },
      { status: 500 }
    );
  }
}

// DELETE index value
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const segmentId = searchParams.get('segmentId');
    const kviType = searchParams.get('kviType');
    const competitorId = searchParams.get('competitorId');
    const salesChannel = searchParams.get('salesChannel');
    
    if (!segmentId || !kviType || !competitorId || !salesChannel) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const result = await IndexValue.findOneAndDelete({
      segmentId,
      kviType,
      competitorId,
      salesChannel
    });
    
    if (!result) {
      return NextResponse.json(
        { error: 'Index value not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Index value deleted successfully' });
  } catch (error) {
    console.error('Error deleting index value:', error);
    return NextResponse.json(
      { error: 'Failed to delete index value' },
      { status: 500 }
    );
  }
} 