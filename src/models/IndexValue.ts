import mongoose, { Schema, Document } from 'mongoose';

export interface IIndexValue extends Document {
  segmentId: string;
  kviType: 'SKVI' | 'KVI' | 'Background' | 'Foreground';
  value: number;
  competitorId: string;
  salesChannel: 'getir' | 'getirbuyuk';
  lastUpdated: Date;
}

const IndexValueSchema: Schema = new Schema({
  segmentId: {
    type: String,
    required: true,
    ref: 'Segment'
  },
  kviType: {
    type: String,
    required: true,
    enum: ['SKVI', 'KVI', 'Background', 'Foreground']
  },
  value: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  competitorId: {
    type: String,
    required: true
  },
  salesChannel: {
    type: String,
    required: true,
    enum: ['getir', 'getirbuyuk']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index for unique combinations
IndexValueSchema.index({ 
  segmentId: 1, 
  kviType: 1, 
  competitorId: 1, 
  salesChannel: 1 
}, { unique: true });

export default mongoose.models.IndexValue || mongoose.model<IIndexValue>('IndexValue', IndexValueSchema); 