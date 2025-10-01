import mongoose, { Schema, Document } from 'mongoose';

export interface IWarehouse extends Document {
  name: string;
  province: string;
  district: string;
  region: string;
  demography: 'Upper Premium' | 'Premium' | 'Upper Medium' | 'Medium' | 'Lower Medium' | 'Mass';
  size: 'Micro' | 'Mini' | 'Midi' | 'Maxi' | 'GB Midi' | 'GB Maxi';
  domains: ('Getir' | 'Getir Büyük' | 'Getir Express' | 'Getir Market')[];
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
    enum: ['Upper Premium', 'Premium', 'Upper Medium', 'Medium', 'Lower Medium', 'Mass']
  },
  size: {
    type: String,
    required: true,
    enum: ['Micro', 'Mini', 'Midi', 'Maxi', 'GB Midi', 'GB Maxi']
  },
  domains: [{
    type: String,
    required: true,
    enum: ['Getir', 'Getir Büyük', 'Getir Express', 'Getir Market']
  }]
}, {
  timestamps: true
});

export default mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema); 