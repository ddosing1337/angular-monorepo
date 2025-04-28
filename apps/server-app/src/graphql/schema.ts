import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLFloat,
} from 'graphql';
import { LayerModel } from '../models/layer.model';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';

// === Geometry ===

const Geometry = new GraphQLObjectType({
  name: 'Geometry',
  fields: {
    type: { type: new GraphQLNonNull(GraphQLString) },
    coordinates: {
      type: new GraphQLNonNull(GraphQLJSON),
    },
  },
});

const GeometryInput = new GraphQLInputObjectType({
  name: 'GeometryInput',
  fields: {
    type: { type: new GraphQLNonNull(GraphQLString) },
    coordinates: {
      type: new GraphQLNonNull(GraphQLJSON),
    },
  },
});

// === Feature ===

const Feature = new GraphQLObjectType({
  name: 'Feature',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    type: { type: new GraphQLNonNull(GraphQLString) },
    geometry: { type: new GraphQLNonNull(Geometry) },
    properties: { type: GraphQLJSONObject },
  },
});

const CreateFeatureInput = new GraphQLInputObjectType({
  name: 'CreateFeatureInput',
  fields: {
    type: { type: GraphQLString },
    geometry: { type: new GraphQLNonNull(GeometryInput) },
    properties: { type: GraphQLJSONObject },
  },
});

const UpdateFeatureInput = new GraphQLInputObjectType({
  name: 'UpdateFeatureInput',
  fields: {
    id: { type: GraphQLID },
    type: { type: GraphQLString },
    geometry: { type: new GraphQLNonNull(GeometryInput) },
    properties: { type: GraphQLJSONObject },
  },
});

// === Layer ===

const Layer = new GraphQLObjectType({
  name: 'Layer',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    features: { type: new GraphQLList(Feature) },
  },
});

const CreateLayerInput = new GraphQLInputObjectType({
  name: 'LayerInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    features: { type: new GraphQLList(CreateFeatureInput) },
  },
});

const UpdateLayerInput = new GraphQLInputObjectType({
  name: 'UpdateLayerInput',
  fields: {
    name: { type: GraphQLString },
    features: { type: new GraphQLList(UpdateFeatureInput) },
  },
});

// === Query ===

const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    getLayers: {
      type: new GraphQLList(Layer),
      resolve: () => LayerModel.find(),
    },
    getLayer: {
      type: Layer,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: (_, { id }) => LayerModel.findById(id),
    },
  },
});

// === Mutation ===

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createLayer: {
      type: Layer,
      args: {
        input: { type: new GraphQLNonNull(CreateLayerInput) },
      },
      resolve: (_, { input }) => new LayerModel(input).save(),
    },
    updateLayer: {
      type: Layer,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        input: { type: new GraphQLNonNull(UpdateLayerInput) },
      },
      resolve: async (_, { id, input }) => {
        const updated = await LayerModel.findByIdAndUpdate(id, input, {
          new: true,
          runValidators: true,
        });
        if (!updated) {
          throw new Error('Layer not found');
        }
        return updated;
      },
    },
    deleteLayer: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_, { id }) => {
        const result = await LayerModel.findByIdAndDelete(id);
        return !!result;
      },
    },
  },
});

// === Schema ===

export const schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});
