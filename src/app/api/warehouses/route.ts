import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import { mockWarehouses } from '@/utils/mockApi';

// GET /api/warehouses - Get all warehouses with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const domain = searchParams.get('domain');
    const demography = searchParams.get('demography');
    const size = searchParams.get('size');

    // For now, use mock data. In production, you would fetch from external API
    let warehouses = [...mockWarehouses];

    // Apply filters
    if (province) {
      warehouses = warehouses.filter(w => w.province.toLowerCase().includes(province.toLowerCase()));
    }
    if (district) {
      warehouses = warehouses.filter(w => w.district.toLowerCase().includes(district.toLowerCase()));
    }
    if (domain) {
      warehouses = warehouses.filter(w => w.domain === domain);
    }
    if (demography) {
      warehouses = warehouses.filter(w => w.demography === demography);
    }
    if (size) {
      warehouses = warehouses.filter(w => w.size === size);
    }

    return NextResponse.json(warehouses);
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
    await connectDB();
    const body = await request.json();
    
    const warehouse = new Warehouse({
      name: body.name,
      province: body.province,
      district: body.district,
      demography: body.demography,
      size: body.size,
      domain: body.domain
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
      domain: savedWarehouse.domain
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