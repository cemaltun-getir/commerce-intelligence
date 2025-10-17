import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WastePrice } from '@/models/WastePrice';

// PUT /api/waste-prices/[id] - Update waste price
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id } = await params;
    
    const wastePrice = await WastePrice.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!wastePrice) {
      return NextResponse.json(
        { error: 'Waste price not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(wastePrice.toObject());
  } catch (error) {
    console.error('Error updating waste price:', error);
    return NextResponse.json(
      { error: 'Failed to update waste price' },
      { status: 500 }
    );
  }
}
