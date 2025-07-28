import mongoose, { Schema, Document } from 'mongoose';

export interface IWarehouse extends Document {
  name: string;
  province: string;
  district: string;
  region: string;
  demography: 'Urban' | 'Suburban' | 'Rural';
  size: 'Small' | 'Medium' | 'Large' | 'XLarge';
  domain: 'Getir10' | 'Getir30';
}

const WarehouseSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  province: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: String,
    required: true,
    trim: true
  },
  demography: {
    type: String,
    required: true,
    enum: ['Urban', 'Suburban', 'Rural']
  },
  size: {
    type: String,
    required: true,
    enum: ['Small', 'Medium', 'Large', 'XLarge']
  },
  domain: {
    type: String,
    required: true,
    enum: ['Getir10', 'Getir30']
  }
}, {
  timestamps: true
});

export default mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema); 