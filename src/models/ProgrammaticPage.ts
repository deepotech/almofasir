import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProgrammaticPage extends Document {
  keywordSlug: string;
  title: string;
  content: string;
  symbolRef?: string;
  generatedAt: Date;
}

const ProgrammaticPageSchema: Schema = new Schema({
  keywordSlug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  symbolRef: { type: String },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ProgrammaticPage: Model<IProgrammaticPage> = mongoose.models.ProgrammaticPage || mongoose.model<IProgrammaticPage>('ProgrammaticPage', ProgrammaticPageSchema);

export default ProgrammaticPage;
