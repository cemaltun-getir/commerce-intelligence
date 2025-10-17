import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WastePrice } from '@/models/WastePrice';

// POST /api/waste-prices/[id]/reject - Reject waste price
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, notes } = body;
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }
    
    const wastePrice = await WastePrice.findById(id);
    
    if (!wastePrice) {
      return NextResponse.json(
        { error: 'Waste price not found' },
        { status: 404 }
      );
    }
    
    wastePrice.status = 'rejected';
    wastePrice.confirmedAt = new Date();
    wastePrice.confirmedBy = userId;
    wastePrice.notes = notes;
    
    await wastePrice.save();
    
    return NextResponse.json(wastePrice.toObject());
  } catch (error) {
    console.error('Error rejecting waste price:', error);
    return NextResponse.json(
      { error: 'Failed to reject waste price' },
      { status: 500 }
    );
  }
}
