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

// GET /api/segments - Get all segments
export async function GET() {
  try {
    await connectDB();
    const segments = await Segment.find({}).sort({ lastUpdated: -1 });
    
    // Transform segments to match frontend interface with computed data
    const transformedSegments = segments.map(segment => {
      const warehouses = getWarehousesByIds(segment.warehouseIds);
      const computedData = calculateSegmentData(warehouses);
      
      return {
        id: segment._id.toString(),
        name: segment.name,
        warehouseIds: segment.warehouseIds,
        warehouses,
        lastUpdated: segment.lastUpdated.toISOString(),
        ...computedData
      };
    });
    
    return NextResponse.json(transformedSegments);
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segments' },
      { status: 500 }
    );
  }
}

// POST /api/segments - Create new segment
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Validate warehouse IDs
    const warehouses = getWarehousesByIds(body.warehouseIds || []);
    if (warehouses.length !== (body.warehouseIds || []).length) {
      return NextResponse.json(
        { error: 'Some warehouse IDs are invalid' },
        { status: 400 }
      );
    }
    
    const segment = new Segment({
      name: body.name,
      warehouseIds: body.warehouseIds || [],
      lastUpdated: new Date()
    });
    
    const savedSegment = await segment.save();
    
    // Calculate computed data from warehouses
    const computedData = calculateSegmentData(warehouses);
    
    // Transform to match frontend interface
    const transformedSegment = {
      id: savedSegment._id.toString(),
      name: savedSegment.name,
      warehouseIds: savedSegment.warehouseIds,
      warehouses,
      lastUpdated: savedSegment.lastUpdated.toISOString(),
      ...computedData
    };
    
    return NextResponse.json(transformedSegment, { status: 201 });
  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json(
      { error: 'Failed to create segment' },
      { status: 500 }
    );
  }
} 