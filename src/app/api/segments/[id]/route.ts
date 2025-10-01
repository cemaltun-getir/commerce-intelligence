import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Segment from '@/models/Segment';
import IndexValue from '@/models/IndexValue';
import { Warehouse } from '@/types';

// Helper function to calculate segment data from warehouses
function calculateSegmentData(warehouses: Warehouse[]) {
  const domains = [...new Set(warehouses.flatMap(w => w.domains || []))];
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
    
    const externalWarehouses = await response.json();
    
    // Transform external warehouse format to internal format
    const warehouses: Warehouse[] = externalWarehouses.map((warehouse: any) => ({
      id: warehouse.id,
      name: warehouse.name,
      province: warehouse.city, // Map city to province
      district: warehouse.region, // Map region to district
      region: warehouse.region,
      demography: warehouse.demography,
      size: warehouse.size,
      domains: warehouse.domains || [warehouse.domain] // Support both new multiple domains and legacy single domain
    }));
    
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
    const warehouses = await getWarehousesByIds(segment.warehouseIds);
    const computedData = calculateSegmentData(warehouses);
    
    // Transform to match frontend interface
    const response = {
      id: (segment._id as any).toString(),
      name: segment.name,
      warehouseIds: segment.warehouseIds,
      priceLocation: segment.priceLocation, // No fallback - show actual value or undefined
      warehouses,
      lastUpdated: segment.lastUpdated.toISOString(),
      ...computedData
    };
    
    return NextResponse.json(response);
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
    
    // Find the segment
    const segment = await Segment.findById(id);
    if (!segment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      );
    }

    // If updating warehouses, validate and check conflicts
    if (body.warehouseIds) {
      if (body.warehouseIds.length === 0) {
        return NextResponse.json(
          { error: 'At least one warehouse must be selected for the segment' },
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

      // Check for conflicts (excluding current segment)
      const conflictCheck = await checkWarehouseConflicts(body.warehouseIds, id);
      if (conflictCheck.hasConflicts) {
        const warehouseNames = conflictCheck.conflictingWarehouses
          .map(whId => warehouses.find(w => w.id === whId)?.name || whId)
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

    // Update segment fields
    if (body.name !== undefined) segment.name = body.name;
    if (body.warehouseIds !== undefined) segment.warehouseIds = body.warehouseIds;
    if (body.priceLocation !== undefined) segment.priceLocation = body.priceLocation;
    segment.lastUpdated = new Date();

    const updatedSegment = await segment.save();

    // Get warehouse data for response
    const warehouses = await getWarehousesByIds(updatedSegment.warehouseIds);
    const computedData = calculateSegmentData(warehouses);

    const response = {
      id: (updatedSegment._id as any).toString(),
      name: updatedSegment.name,
      warehouseIds: updatedSegment.warehouseIds,
      priceLocation: updatedSegment.priceLocation,
      warehouses,
      lastUpdated: updatedSegment.lastUpdated.toISOString(),
      ...computedData
    };

    return NextResponse.json(response);

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
    
    // Delete all related index values for this segment
    const deleteResult = await IndexValue.deleteMany({ segmentId: id });
    
    console.log(`Deleted ${deleteResult.deletedCount} index values for segment ${id}`);
    
    return NextResponse.json({ 
      message: 'Segment deleted successfully',
      deletedIndexValues: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('Error deleting segment:', error);
    return NextResponse.json(
      { error: 'Failed to delete segment' },
      { status: 500 }
    );
  }
} 