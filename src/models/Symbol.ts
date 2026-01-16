import mongoose, { Schema, Document } from 'mongoose';

export interface ISymbol extends Document {
    name: string;
    slug: string;
    category: string;
    icon: string;
    interpretations: {
        general: string;
        ibn_sirin?: string;
        nabulsi?: string;
        psychological?: string;
    };
    variations: Array<{
        context: string; // e.g., 'single_woman', 'married_woman'
        meaning: string;
    }>;
    relatedSymbols: string[]; // slugs
    viewCount: number;
}

const SymbolSchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        slug: { type: String, required: true, unique: true, index: true },
        category: { type: String, required: true },
        icon: { type: String, default: '💭' },
        interpretations: {
            general: { type: String, required: true },
            ibn_sirin: { type: String },
            nabulsi: { type: String },
            psychological: { type: String }
        },
        variations: [{
            context: { type: String },
            meaning: { type: String }
        }],
        relatedSymbols: [{ type: String }],
        viewCount: { type: Number, default: 0 }
    },
    { timestamps: true }
);

export default mongoose.models.Symbol || mongoose.model<ISymbol>('Symbol', SymbolSchema);
