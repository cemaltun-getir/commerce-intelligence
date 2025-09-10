import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import { Warehouse as WarehouseType } from '@/types';

// GET /api/warehouses - Get all warehouses with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const domain = searchParams.get('domain');
    const demography = searchParams.get('demography');
    const size = searchParams.get('size');

    // Fetch data from external API
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
      filteredWarehouses = filteredWarehouses.filter(w => w.domain === domain);
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

// POST /api/warehouses - Create new warehouse (for admin purposes)
export async function POST(request: NextRequest) {
  try {
    // Temporarily disabled MongoDB connection for production
    // await connectDB();
    const body = await request.json();
    
    // For now, return a mock response since we don't have MongoDB set up
    const mockWarehouse = {
      id: `mock_${Date.now()}`,
      name: body.name,
      province: body.province,
      district: body.district,
      demography: body.demography,
      size: body.size,
      domain: body.domain
    };
    
    return NextResponse.json(mockWarehouse, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
} 