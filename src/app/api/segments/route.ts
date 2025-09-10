import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Segment from '@/models/Segment';
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

// Helper function to get warehouses by IDs from external API
async function getWarehousesByIds(warehouseIds: string[]): Promise<Warehouse[]> {
  try {
    const externalApiBase = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';
    const response = await fetch(`${externalApiBase}/locations`);
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }
    
    const warehouses: Warehouse[] = await response.json();
    return warehouses.filter(w => warehouseIds.includes(w.id));
  } catch (error) {
    console.error('Error fetching warehouses from external API:', error);
    return [];
  }
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
    const transformedSegments = await Promise.all(segments.map(async (segment) => {
      const warehouses = await getWarehousesByIds(segment.warehouseIds);
      const computedData = calculateSegmentData(warehouses);
      
      return {
        id: (segment._id as any).toString(),
        name: segment.name,
        warehouseIds: segment.warehouseIds,
        priceLocation: segment.priceLocation, // No fallback - show actual value or undefined
        warehouses,
        lastUpdated: segment.lastUpdated.toISOString(),
        ...computedData
      };
    }));
    
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

    // Validate that priceLocation is provided (mandatory)
    if (!body.priceLocation) {
      return NextResponse.json(
        { error: 'Price location is required for segment creation' },
        { status: 400 }
      );
    }
    
    // Validate warehouse IDs
    const warehouses = await getWarehousesByIds(body.warehouseIds);
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
      priceLocation: body.priceLocation,
      lastUpdated: new Date()
    });
    
    const savedSegment = await segment.save();
    
    // Calculate computed data from warehouses
    const computedData = calculateSegmentData(warehouses);

    const response = {
      id: (savedSegment._id as any).toString(),
      name: savedSegment.name,
      warehouseIds: savedSegment.warehouseIds,
      priceLocation: savedSegment.priceLocation,
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