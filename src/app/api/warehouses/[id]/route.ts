import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import { Warehouse as WarehouseType } from '@/types';

// GET /api/warehouses/[id] - Get single warehouse
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch data from external API
    const response = await fetch('http://localhost:3001/api/external/locations');
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }
    
    const warehouses: WarehouseType[] = await response.json();
    const warehouse = warehouses.find(w => w.id === id);
    
    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(warehouse);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse' },
      { status: 500 }
    );
  }
}

// PUT /api/warehouses/[id] - Update warehouse
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    
    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      id,
      {
        name: body.name,
        province: body.province,
        district: body.district,
        demography: body.demography,
        size: body.size,
        domain: body.domain
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }
    
    // Transform to match frontend interface
    const transformedWarehouse = {
      id: updatedWarehouse._id.toString(),
      name: updatedWarehouse.name,
      province: updatedWarehouse.province,
      district: updatedWarehouse.district,
      demography: updatedWarehouse.demography,
      size: updatedWarehouse.size,
      domain: updatedWarehouse.domain
    };
    
    return NextResponse.json(transformedWarehouse);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to update warehouse' },
      { status: 500 }
    );
  }
}

// DELETE /api/warehouses/[id] - Delete warehouse
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const deletedWarehouse = await Warehouse.findByIdAndDelete(id);
    
    if (!deletedWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to delete warehouse' },
      { status: 500 }
    );
  }
} 