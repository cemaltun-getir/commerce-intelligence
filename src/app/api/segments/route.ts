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

// Helper function to check for warehouse conflicts across segments
async function checkWarehouseConflicts(warehouseIds: string[], excludeSegmentId?: string): Promise<{ hasConflicts: boolean; conflictingWarehouses: string[]; segmentNames: string[] }> {
  const conflictingWarehouses: string[] = [];
  const segmentNames: string[] = [];
  
  // Find all segments that contain any of the warehouse IDs
  const query = excludeSegmentId 
    ? { warehouseIds: { $in: warehouseIds }, _id: { $ne: excludeSegmentId } }
    : { warehouseIds: { $in: warehouseIds } };
    
  const conflictingSegments = await Segment.find(query);
  
  for (const segment of conflictingSegments) {
    for (const warehouseId of warehouseIds) {
      if (segment.warehouseIds.includes(warehouseId) && !conflictingWarehouses.includes(warehouseId)) {
        conflictingWarehouses.push(warehouseId);
        if (!segmentNames.includes(segment.name)) {
          segmentNames.push(segment.name);
        }
      }
    }
  }
  
  return {
    hasConflicts: conflictingWarehouses.length > 0,
    conflictingWarehouses,
    segmentNames
  };
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
        id: (segment._id as any).toString(),
        name: segment.name,
        warehouseIds: segment.warehouseIds,
        apiLocation: segment.apiLocation, // No fallback - show actual value or undefined
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
    
    // Validate that warehouseIds are provided
    if (!body.warehouseIds || body.warehouseIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one warehouse must be selected for the segment' },
        { status: 400 }
      );
    }

    // Validate that apiLocation is provided (mandatory)
    if (!body.apiLocation) {
      return NextResponse.json(
        { error: 'API location is required for segment creation' },
        { status: 400 }
      );
    }
    
    // Validate warehouse IDs
    const warehouses = getWarehousesByIds(body.warehouseIds);
    if (warehouses.length !== body.warehouseIds.length) {
      return NextResponse.json(
        { error: 'Some warehouse IDs are invalid' },
        { status: 400 }
      );
    }
    
    // Check for warehouse conflicts with existing segments
    if (body.warehouseIds && body.warehouseIds.length > 0) {
      const conflictCheck = await checkWarehouseConflicts(body.warehouseIds);
      if (conflictCheck.hasConflicts) {
        const warehouseNames = conflictCheck.conflictingWarehouses
          .map(id => warehouses.find(w => w.id === id)?.name || id)
          .join(', ');
        
        const segmentNames = conflictCheck.segmentNames.join(', ');
        
        return NextResponse.json(
          { 
            error: `The following warehouses are already assigned to segment(s) "${segmentNames}": ${warehouseNames}. Each warehouse can only belong to one segment.`,
            conflictingWarehouses: conflictCheck.conflictingWarehouses,
            conflictingSegments: conflictCheck.segmentNames
          },
          { status: 400 }
        );
      }
    }
    
    const segment = new Segment({
      name: body.name,
      warehouseIds: body.warehouseIds || [],
      apiLocation: body.apiLocation,
      lastUpdated: new Date()
    });
    
    const savedSegment = await segment.save();
    
    // Calculate computed data from warehouses
    const computedData = calculateSegmentData(warehouses);

    const response = {
      id: (savedSegment._id as any).toString(),
      name: savedSegment.name,
      warehouseIds: savedSegment.warehouseIds,
      apiLocation: savedSegment.apiLocation,
      lastUpdated: savedSegment.lastUpdated.toISOString(),
      ...computedData
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json(
      { error: 'Failed to create segment' },
      { status: 500 }
    );
  }
} 