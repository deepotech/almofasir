import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPageMetrics extends Document {
  slug: string;
  views: number;
  likes: number;
  dislikes: number;
  lastUpdated: Date;
}

const PageMetricsSchema: Schema = new Schema({
  slug: { type: String, required: true, unique: true, index: true },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

const PageMetrics: Model<IPageMetrics> = mongoose.models.PageMetrics || mongoose.model<IPageMetrics>('PageMetrics', PageMetricsSchema);

export default PageMetrics;
