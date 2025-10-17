import mongoose, { Schema, Document } from 'mongoose';

export interface IAggressionTier {
  name: string;
  minDays: number;
  maxDays: number;
  baseDiscount: number;
  dailyIncrement: number;
}

export interface IWasteConfiguration extends Document {
  aggressionTiers: IAggressionTier[];
  minMarginPercent: number;
  maxDiscountPercent: number;
  lastUpdated: Date;
  updatedBy?: string;
}

const AggressionTierSchema = new Schema<IAggressionTier>({
  name: { type: String, required: true },
  minDays: { type: Number, required: true },
  maxDays: { type: Number, required: true },
  baseDiscount: { type: Number, required: true },
  dailyIncrement: { type: Number, required: true },
});

const WasteConfigurationSchema = new Schema<IWasteConfiguration>({
  aggressionTiers: [AggressionTierSchema],
  minMarginPercent: { type: Number, default: 5 },
  maxDiscountPercent: { type: Number, default: 70 },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: String },
});

// Ensure only one configuration document exists
WasteConfigurationSchema.index({}, { unique: true });

export const WasteConfiguration = mongoose.models.WasteConfiguration || mongoose.model<IWasteConfiguration>('WasteConfiguration', WasteConfigurationSchema);
