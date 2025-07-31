import mongoose, { Schema, Document } from 'mongoose';

export interface ISegment extends Document {
  name: string;
  warehouseIds: string[];
  priceLocation: string;
  lastUpdated: Date;
}

const SegmentSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  warehouseIds: [{
    type: String,
    required: true
  }],
  priceLocation: {
    type: String,
    required: true,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Force recreation of the model to avoid caching issues
if (mongoose.models.Segment) {
  delete mongoose.models.Segment;
}

export default mongoose.model<ISegment>('Segment', SegmentSchema); 