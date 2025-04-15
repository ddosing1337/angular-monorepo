import { Schema, model, Document } from 'mongoose';

export interface Geometry {
  type: string;
  coordinates: any;
}

export interface FeatureType {
  type: string;
  geometry: Geometry;
  properties?: any;
}

export interface LayerDocument extends Document {
  name: string;
  features: FeatureType[];
}

const GeometrySchema = new Schema<Geometry>(
  {
    type: { type: String, required: true },
    coordinates: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const FeatureSchema = new Schema<FeatureType>(
  {
    type: { type: String, default: 'Feature' },
    geometry: GeometrySchema,
    properties: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const LayerSchema = new Schema<LayerDocument>({
  name: { type: String, required: true },
  features: [FeatureSchema],
});

export const LayerModel = model<LayerDocument>('Layer', LayerSchema);
