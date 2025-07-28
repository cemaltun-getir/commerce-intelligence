import mongoose, { Schema, Document } from 'mongoose';

export interface ISegment extends Document {
  name: string;
  warehouseIds: string[];
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
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.models.Segment || mongoose.model<ISegment>('Segment', SegmentSchema); 