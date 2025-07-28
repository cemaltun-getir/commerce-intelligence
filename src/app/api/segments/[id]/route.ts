import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Segment from '@/models/Segment';
import { mockWarehouses } from '@/utils/mockApi';
import { Warehouse } from '@/types';

// Helper function to calculate segment data from warehouses
function calculateSegmentData(warehouses: Warehouse[]) {
  const domains = [...new Set(warehouses.map(w => w.domain))];
  const provinces = [...new Set(warehouses.map(w => w.province))];
  const districts = [...new Set(warehouses.map(w => w.district))];
  const regions = [...new Set(warehouses.map(w => w.region))];
  const demographies = [...new Set(warehouses.map(w => w.demography))];
  const sizes = [...new Set(warehouses.map(w => w.size))];
  
  return { domains, provinces, districts, regions, demographies, sizes };
}

// Helper function to get warehouses by IDs (using mock data for now)
function getWarehousesByIds(warehouseIds: string[]): Warehouse[] {
  return mockWarehouses.filter(w => warehouseIds.includes(w.id));
}

// GET /api/segments/[id] - Get single segment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const segment = await Segment.findById(id);
    
    if (!segment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      );
    }
    
    // Get warehouses and calculate computed data
    const warehouses = getWarehousesByIds(segment.warehouseIds);
    const computedData = calculateSegmentData(warehouses);
    
    // Transform to match frontend interface
    const transformedSegment = {
      id: segment._id.toString(),
      name: segment.name,
      warehouseIds: segment.warehouseIds,
      warehouses,
      lastUpdated: segment.lastUpdated.toISOString(),
      ...computedData
    };
    
    return NextResponse.json(transformedSegment);
  } catch (error) {
    console.error('Error fetching segment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segment' },
      { status: 500 }
    );
  }
}

// PUT /api/segments/[id] - Update segment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    
    // Validate warehouse IDs if provided
    if (body.warehouseIds) {
      const warehouses = getWarehousesByIds(body.warehouseIds);
      if (warehouses.length !== body.warehouseIds.length) {
        return NextResponse.json(
          { error: 'Some warehouse IDs are invalid' },
          { status: 400 }
        );
      }
    }
    
    const updatedSegment = await Segment.findByIdAndUpdate(
      id,
      {
        ...(body.name && { name: body.name }),
        ...(body.warehouseIds && { warehouseIds: body.warehouseIds }),
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedSegment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      );
    }
    
    // Get warehouses and calculate computed data
    const warehouses = getWarehousesByIds(updatedSegment.warehouseIds);
    const computedData = calculateSegmentData(warehouses);
    
    // Transform to match frontend interface
    const transformedSegment = {
      id: updatedSegment._id.toString(),
      name: updatedSegment.name,
      warehouseIds: updatedSegment.warehouseIds,
      warehouses,
      lastUpdated: updatedSegment.lastUpdated.toISOString(),
      ...computedData
    };
    
    return NextResponse.json(transformedSegment);
  } catch (error) {
    console.error('Error updating segment:', error);
    return NextResponse.json(
      { error: 'Failed to update segment' },
      { status: 500 }
    );
  }
}

// DELETE /api/segments/[id] - Delete segment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const deletedSegment = await Segment.findByIdAndDelete(id);
    
    if (!deletedSegment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    console.error('Error deleting segment:', error);
    return NextResponse.json(
      { error: 'Failed to delete segment' },
      { status: 500 }
    );
  }
} 