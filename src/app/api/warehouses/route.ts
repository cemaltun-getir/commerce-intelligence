import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import { Warehouse as WarehouseType } from '@/types';

// GET /api/warehouses - Get all warehouses from external API (read-only)
// Note: This fetches live warehouse data from the external price tracker API
// For admin operations (create/update/delete), use the POST/PUT/DELETE endpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const domain = searchParams.get('domain');
    const demography = searchParams.get('demography');
    const size = searchParams.get('size');

    // Fetch live warehouse data from external API
    const externalApiBase = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';
    const response = await fetch(`${externalApiBase}/locations`);
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }
    
    const warehouses: WarehouseType[] = await response.json();

    // Apply filters
    let filteredWarehouses = warehouses;
    
    if (province) {
      filteredWarehouses = filteredWarehouses.filter(w => 
        w.province.toLowerCase().includes(province.toLowerCase())
      );
    }
    if (district) {
      filteredWarehouses = filteredWarehouses.filter(w => 
        w.district.toLowerCase().includes(district.toLowerCase())
      );
    }
    if (domain) {
      filteredWarehouses = filteredWarehouses.filter(w => (w.domains || []).includes(domain as any));
    }
    if (demography) {
      filteredWarehouses = filteredWarehouses.filter(w => w.demography === demography);
    }
    if (size) {
      filteredWarehouses = filteredWarehouses.filter(w => w.size === size);
    }

    return NextResponse.json(filteredWarehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

// POST /api/warehouses - Create new warehouse in local database (admin only)
// Note: This creates a warehouse record in our local MongoDB database
// The main warehouse data still comes from external API via GET endpoint
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const warehouse = new Warehouse({
      name: body.name,
      province: body.province,
      district: body.district,
      demography: body.demography,
      size: body.size,
      domains: body.domains || [body.domain] // Support both new multiple domains and legacy single domain
    });
    
    const savedWarehouse = await warehouse.save();
    
    // Transform to match frontend interface
    const transformedWarehouse = {
      id: savedWarehouse._id.toString(),
      name: savedWarehouse.name,
      province: savedWarehouse.province,
      district: savedWarehouse.district,
      demography: savedWarehouse.demography,
      size: savedWarehouse.size,
      domains: savedWarehouse.domains
    };
    
    return NextResponse.json(transformedWarehouse, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
} 