import { Schema, model, Document, ObjectId } from 'mongoose';

export interface Geometry {
  type: string;
  coordinates: any; //refactor: replace with type
}

export interface Feature {
  _id: ObjectId;
  type: string;
  geometry: Geometry;
  properties: any;
}

export interface Layer extends Document {
  name: string;
  features: Feature[];
}

const GeomentrySchema = new Schema(
  {
    type: { type: String, required: true },
    coordinates: { type: [], required: true }, //refactor: replace with type
  },
  { _id: false }
);

const FeatureSchema = new Schema(
  {
    type: { type: String, default: 'Feature' },
    geometry: {
      type: GeomentrySchema,
      required: true,
    },
    properties: { type: Schema.Types.Mixed },
  },
  {
    _id: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

const LayerSchema = new Schema<Layer>(
  {
    name: { type: String, required: true },
    features: {
      type: [FeatureSchema],
      default: [],
    },
  },
  {
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

export const LayerModel = model<Layer>('Layer', LayerSchema);
