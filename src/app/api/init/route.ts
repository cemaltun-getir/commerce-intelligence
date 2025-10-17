import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WasteConfiguration } from '@/models/WasteConfiguration';
import { getDefaultWasteConfiguration } from '@/utils/wastePriceCalculations';

// POST /api/init - Initialize database with default data
export async function POST(request: NextRequest) {
  try {
    console.log('Starting database initialization...');
    await connectDB();
    console.log('Database connected');
    
    const results = {
      wasteConfiguration: { status: 'skipped', message: '' }
    };
    
    // Check and create waste configuration if needed
    const existingConfig = await WasteConfiguration.findOne();
    
    if (!existingConfig) {
      console.log('Creating default waste configuration...');
      const defaultConfig = getDefaultWasteConfiguration();
      
      try {
        const configuration = new WasteConfiguration({
          ...defaultConfig,
          lastUpdated: new Date(),
        });
        await configuration.save();
        results.wasteConfiguration = {
          status: 'created',
          message: 'Default waste configuration created successfully'
        };
        console.log('Default waste configuration created');
      } catch (error: any) {
        if (error.code === 11000) {
          results.wasteConfiguration = {
            status: 'exists',
            message: 'Waste configuration already exists (created by concurrent request)'
          };
          console.log('Configuration already exists');
        } else {
          throw error;
        }
      }
    } else {
      results.wasteConfiguration = {
        status: 'exists',
        message: 'Waste configuration already exists'
      };
      console.log('Waste configuration already exists');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database initialization completed',
      results
    });
  } catch (error: any) {
    console.error('Error during database initialization:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// GET /api/init - Check initialization status
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const status = {
      connected: true,
      wasteConfiguration: false
    };
    
    const config = await WasteConfiguration.findOne();
    status.wasteConfiguration = !!config;
    
    return NextResponse.json({
      success: true,
      status,
      ready: status.wasteConfiguration
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check initialization status',
        details: error.message
      },
      { status: 500 }
    );
  }
}
