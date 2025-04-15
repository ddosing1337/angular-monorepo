import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLSchema,
  GraphQLID,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLInputObjectType,
} from 'graphql';
import { LayerModel } from '../models/layer.model';

const GeometryInputType = new GraphQLInputObjectType({
  name: 'GeometryInput',
  fields: {
    type: { type: new GraphQLNonNull(GraphQLString) },
    coordinates: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLList(GraphQLFloat))),
    },
  },
});

const FeatureInputType = new GraphQLInputObjectType({
  name: 'FeatureInput',
  fields: {
    type: { type: new GraphQLNonNull(GraphQLString) },
    geometry: { type: new GraphQLNonNull(GeometryInputType) },
    properties: { type: GraphQLString },
  },
});

const FeatureType = new GraphQLObjectType({
  name: 'Feature',
  fields: {
    type: { type: GraphQLString },
    geometry: new GraphQLObjectType({
      name: 'Geometry',
      fields: {
        type: { type: GraphQLString },
        coordinates: { type: new GraphQLList(new GraphQLList(GraphQLFloat)) },
      },
    }),
    properties: { type: GraphQLString },
  },
});

const LayerType = new GraphQLObjectType({
  name: 'Layer',
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    features: { type: new GraphQLList(FeatureType) },
  },
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    layers: {
      type: new GraphQLList(LayerType),
      resolve: () => LayerModel.find(),
    },
  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addLayer: {
      type: LayerType,
      args: { name: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: (_, { name }) => new LayerModel({ name, features: [] }).save(),
    },
    deleteLayer: {
      type: LayerType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: (_, { id }) => LayerModel.findByIdAndDelete(id),
    },
    updateLayer: {
      type: LayerType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        name: { type: GraphQLString },
        features: { type: new GraphQLList(FeatureInputType) },
      },
      resolve: async (_, { id, name, features }) => {
        const layer = await LayerModel.findById(id);
        if (!layer) throw new Error('Layer not found');
        if (name !== undefined) layer.name = name;
        if (features !== undefined) layer.features = features;
        return layer.save();
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
