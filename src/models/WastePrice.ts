import mongoose, { Schema, Document } from 'mongoose';

export interface IWastePrice extends Document {
  warehouseId: string;
  skuId: string;
  suggestedWastePrice: number;
  confirmedWastePrice?: number;
  originalSellingPrice: number;
  buyingPrice: number;
  discountPercent: number;
  marginPercent: number;
  quantityOnHand: number;
  daysUntilExpiry: number;
  projectedWasteValue: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'applied';
  createdAt: Date;
  confirmedAt?: Date;
  confirmedBy?: string;
  notes?: string;
  // Snapshots for historical reference
  productName: string;
  categoryName: string;
  warehouseName: string;
  // Category level fields for filtering
  categoryLevel1Id?: string;
  categoryLevel2Id?: string;
  categoryLevel3Id?: string;
  categoryLevel4Id?: string;
}

const WastePriceSchema = new Schema<IWastePrice>({
  warehouseId: { type: String, required: true },
  skuId: { type: String, required: true },
  suggestedWastePrice: { type: Number, required: true },
  confirmedWastePrice: { type: Number },
  originalSellingPrice: { type: Number, required: true },
  buyingPrice: { type: Number, required: true },
  discountPercent: { type: Number, required: true },
  marginPercent: { type: Number, required: true },
  quantityOnHand: { type: Number, required: true },
  daysUntilExpiry: { type: Number, required: true },
  projectedWasteValue: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected', 'applied'],
    default: 'pending',
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  confirmedBy: { type: String },
  notes: { type: String },
  // Snapshots
  productName: { type: String, required: true },
  categoryName: { type: String, required: true },
  warehouseName: { type: String, required: true },
  // Category level fields for filtering
  categoryLevel1Id: { type: String },
  categoryLevel2Id: { type: String },
  categoryLevel3Id: { type: String },
  categoryLevel4Id: { type: String },
});

// Compound index for efficient queries
WastePriceSchema.index({ warehouseId: 1, skuId: 1 });
WastePriceSchema.index({ status: 1, createdAt: -1 });
WastePriceSchema.index({ daysUntilExpiry: 1 });

export const WastePrice = mongoose.models.WastePrice || mongoose.model<IWastePrice>('WastePrice', WastePriceSchema);
