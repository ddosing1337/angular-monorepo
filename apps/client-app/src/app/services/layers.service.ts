import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Observable, map } from 'rxjs';
import { GeoJSON } from 'ol/format';
import { Feature } from 'ol';
import { fromCircle } from 'ol/geom/Polygon';
import { Circle } from 'ol/geom';

@Injectable()
export class LayersService {
  private geojson = new GeoJSON();
  constructor(private apollo: Apollo) {}

  getLayers(): Observable<VectorLayer[]> {
    return this.apollo
      .query<{ getLayers: any[] }>({
        query: gql`
          query GetLayers {
            getLayers {
              id
              name
              features {
                id
                type
                geometry {
                  type
                  coordinates
                }
                properties
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((result) =>
          result.data.getLayers.map((elem) => this.toVectorLayer(elem))
        )
      );
  }

  createLayer(layer: VectorLayer): Observable<VectorLayer> {
    return this.apollo
      .mutate<{ createLayer: any }>({
        mutation: gql`
          mutation CreateLayer($input: LayerInput!) {
            createLayer(input: $input) {
              id
              name
              features {
                id
                type
                geometry {
                  type
                  coordinates
                }
                properties
              }
            }
          }
        `,
        variables: { input: { name: layer.get('name'), features: [] } },
      })
      .pipe(map((result) => this.toVectorLayer(result.data!.createLayer)));
  }

  updateLayer(layer: VectorLayer): Observable<VectorLayer> {
    return this.apollo
      .mutate<{ updateLayer: any }>({
        mutation: gql`
          mutation UpdateLayer($id: ID!, $input: UpdateLayerInput!) {
            updateLayer(id: $id, input: $input) {
              id
              name
              features {
                id
                type
                geometry {
                  type
                  coordinates
                }
                properties
              }
            }
          }
        `,
        variables: {
          id: layer.get('id'),
          input: {
            name: layer.get('name'),
            features: layer
              .get('source')
              .getFeatures()
              .map((feature: Feature) => {
                const geometry = feature.getGeometry();
                const geometryType = geometry?.getType();
                if (geometryType === 'Circle') {
                  const mapped = new Feature();
                  mapped.setProperties({
                    isCircle: true,
                    center: (geometry as Circle).getCenter(),
                    radius: (geometry as Circle).getRadius(),
                  });
                  mapped.setGeometry(fromCircle(geometry as Circle, 1));
                  return this.geojson.writeFeatureObject(mapped);
                }
                return this.geojson.writeFeatureObject(feature);
              }),
          },
        },
      })
      .pipe(map((result) => this.toVectorLayer(result.data!.updateLayer)));
  }

  deleteLayer(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteLayer: boolean }>({
        mutation: gql`
          mutation DeleteLayer($id: ID!) {
            deleteLayer(id: $id)
          }
        `,
        variables: { id },
      })
      .pipe(map((result) => result.data!.deleteLayer));
  }

  private toVectorLayer(srcLayer: any): VectorLayer {
    const layer = new VectorLayer({
      source: new VectorSource({
        features: this.geojson
          .readFeatures({
            type: 'FeatureCollection',
            features: srcLayer.features,
          })
          .map((feature) => {
            const properties = feature.getProperties();
            if (properties['isCircle']) {
              const mapped = feature;
              mapped.setGeometry(
                new Circle(properties['center'], properties['radius'])
              );
              return mapped;
            }
            return feature;
          }),
        wrapX: false,
      }),
      visible: false,
    });
    layer.set('name', srcLayer.name);
    layer.set('id', srcLayer.id);

    return layer;
  }
}
