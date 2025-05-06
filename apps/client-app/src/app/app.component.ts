import {
  ChangeDetectionStrategy,
  Component,
  effect,
  NgZone,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  ButtonComponent,
  ListComponent,
  ModalComponent,
  SelectComponent,
  TextFieldComponent,
} from '@angular-monorepo/ui';
import { MapComponent } from './commponents/map/map.component';
import { Collection, Feature, Map, View } from 'ol';
import Draw from 'ol/interaction/Draw';
import { defaults, FullScreen } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Layer } from 'ol/layer';
import { CommonModule } from '@angular/common';
import { SelectOption } from 'libs/ui/src/interfaces/select-option.interface';
import { FeaturePipe } from './pipes/feature.pipe';
import BaseLayer from 'ol/layer/Base';
import { LayersService } from './services/layers.service';
import Transform from 'ol-ext/interaction/Transform';
import Tooltip from 'ol-ext/overlay/Tooltip';
import { toLonLat } from 'ol/proj';
import { getArea, getLength } from 'ol/sphere';
import { Circle, Geometry, Point } from 'ol/geom';
import { fromEventPattern, Subject, takeUntil, throttleTime } from 'rxjs';
import { fromCircle } from 'ol/geom/Polygon';
import * as turf from '@turf/turf';
import { GeoJSON } from 'ol/format';
import { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { Coordinate } from 'ol/coordinate';

enum FeatureType {
  None = 'None',
  Point = 'Point',
  LineString = 'LineString',
  Polygon = 'Polygon',
  Circle = 'Circle',
}

@Component({
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    MapComponent,
    ListComponent,
    ModalComponent,
    TextFieldComponent,
    SelectComponent,
    FeaturePipe,
  ],
  providers: [LayersService],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'client-app';
  public map!: Map;
  public layers = signal<Array<Layer>>([]);
  public selectedLayer = signal<VectorLayer | null>(null);
  public layerEditActive = signal<boolean>(false);
  public selectedEditOption = signal<FeatureType>(FeatureType.None);
  public addLayerActive = signal<boolean>(false);
  public newLayerName = signal<string>('');
  public layerEditOptions!: SelectOption[];
  public featuresArray: WritableSignal<Array<Feature>> = signal([]);
  public tempLayer!: VectorLayer;
  public uniteOptions!: SelectOption[];
  public selectedUniteOption = signal<Feature | null>(null);
  private destroy$ = new Subject();
  private draw!: Draw;
  private transform!: Transform;
  private tooltip!: Tooltip;
  private geojson = new GeoJSON();
  private selectedFeature = signal<Feature | null>(null);

  constructor(private zone: NgZone, private layersService: LayersService) {
    effect(() => {
      this.map.removeInteraction(this.draw);
      this.addInteraction(this.selectedEditOption());
    });

    effect(() => {
      const selectedFeature = this.selectedFeature();
      this.refreshUniteOptions(selectedFeature);
    });

    effect(() => {
      console.log(this.selectedUniteOption());
    });
  }

  ngOnInit(): void {
    this.initMap();
    this.layerEditOptions = Object.entries(FeatureType).map((e) => {
      return { label: e[0], value: e[1] };
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next('');
    this.destroy$.complete();
  }

  private initMap(): void {
    const rasterLayer = new TileLayer({
      source: new OSM(),
    });
    rasterLayer.set('name', 'Default Raster Layer');

    this.zone.runOutsideAngular(() => {
      this.map = new Map({
        controls: defaults().extend([new FullScreen()]),
        target: 'map',
        layers: [rasterLayer],
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      });
    });

    this.layersService.getLayers().subscribe((res) => {
      res.forEach((layer) => this.map.addLayer(layer));
      this.refreshLayers();
    });

    this.tooltip = new Tooltip();
    this.map.addOverlay(this.tooltip);

    //Tooltip tracking
    this.map.on('singleclick', (event) => {
      let found = false;
      this.map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
        if (!layer) return;
        this.showFeatureTooltip(feature as Feature, event.coordinate);
        found = true;
      });

      if (!found) {
        this.hideFeatureTooltip();
      }
    });

    //Cursor: pointer on hover
    const pointerMove$ = fromEventPattern<PointerEvent>(
      (handler) => this.map.on('pointermove', handler),
      (handler) => this.map.un('pointermove', handler)
    );

    pointerMove$
      .pipe(throttleTime(100), takeUntil(this.destroy$))
      .subscribe((event: any) => {
        const hasFeature = this.map.forEachFeatureAtPixel(
          event.pixel,
          () => true
        );
        this.map.getTargetElement().style.cursor = hasFeature ? 'pointer' : '';
      });
  }

  public addLayer(): void {
    this.cancelLayerEdit();
    const newLayer = new VectorLayer({
      source: new VectorSource({
        features: new Collection<Feature>(),
        wrapX: false,
      }),
      visible: false,
    });
    newLayer.set(
      'name',
      untracked(() => this.newLayerName())
    );
    this.layersService.createLayer(newLayer).subscribe((res) => {
      //feat: handle creating errors
      this.map.addLayer(res);
      this.refreshLayers();
      this.addLayerActive.set(false);
      this.newLayerName.set('');
    });
  }

  public deleteLayer(): void {
    untracked(() => {});

    this.layersService
      .deleteLayer(this.selectedLayer()?.get('id'))
      .subscribe((res) => {
        //feat: handle deleting errors
        this.map.removeLayer(
          untracked(() => {
            return this.selectedLayer() as BaseLayer;
          })
        );
        this.refreshLayers();
      });
  }

  public editLayer(): void {
    this.tempLayer = new VectorLayer({
      source: new VectorSource({
        features: new Collection<Feature>(
          untracked(() =>
            this.selectedLayer()
              ?.get('source')
              .getFeatures()
              .map((f: Feature) => f.clone())
          )
        ),
        wrapX: false,
      }),
    });
    this.map.addLayer(this.tempLayer);
    untracked(() => this.selectedLayer()?.setVisible(false));

    this.transform = new Transform({
      layers: [this.tempLayer, untracked(() => this.selectedLayer())!],
      translate: true,
      scale: true,
      rotate: true,
      enableRotatedTransform: true,
    });
    this.map.addInteraction(this.transform);

    const select$ = fromEventPattern(
      (handler) => this.transform.on('select', handler),
      (handler) => this.transform.un('select', handler)
    );
    select$.subscribe((event: any) => {
      this.selectedFeature.set(event.feature ?? null);
    });

    this.layerEditActive.set(true);
  }

  public selectLayer(layer: VectorLayer): void {
    if (layer !== untracked(() => this.selectedLayer())) {
      this.cancelLayerEdit();
      untracked(() => {
        this.selectedLayer()?.setVisible(false);
      });
      layer.setVisible(true);
      this.selectedLayer.set(layer);
    }
    this.featuresArray.set(layer.get('source').getFeatures());
  }

  public cancelLayerEdit(): void {
    this.map.removeLayer(this.tempLayer);
    this.map.removeInteraction(this.transform);
    this.layerEditActive.set(false);
    this.selectedFeature.set(null);
    this.selectedEditOption.set(FeatureType.None);
    untracked(() => this.selectedLayer()?.setVisible(true));
  }

  public saveLayer(): void {
    untracked(() => {
      this.selectedLayer()?.setSource(this.tempLayer.get('source'));

      this.layersService
        .updateLayer(this.selectedLayer()!)
        .subscribe((updated) => {
          //feat: handle saving error
          this.map.removeLayer(this.tempLayer);
          let selectedLayer = this.selectedLayer();
          selectedLayer?.setProperties(updated.getProperties());
          selectedLayer?.setSource(updated.get('source'));

          this.featuresArray.set(
            this.selectedLayer()?.get('source').getFeatures()
          );
          this.map.removeInteraction(this.transform);
          this.layerEditActive.set(false);
          this.selectedEditOption.set(FeatureType.None);
          untracked(() => this.selectedLayer()?.setVisible(true));
        });
    });
  }

  public addInteraction(type: FeatureType): void {
    if (type !== FeatureType.None) {
      this.draw = new Draw({
        source: this.tempLayer.get('source'),
        type: type,
      });
      this.map.addInteraction(this.draw);
    }
  }

  public undoFeature(): void {
    this.tempLayer.get('source').getFeaturesCollection().pop();
  }

  public onUnite(): void {
    untracked(() => {
      const united = this.unitePolygons(
        this.selectedFeature()!,
        this.selectedUniteOption()!
      );
      console.log(united.getProperties());
      const source = this.tempLayer.get('source');
      source.removeFeatures([
        this.selectedFeature(),
        this.selectedUniteOption(),
      ]);
      source.addFeature(united);
      this.transform.setSelection(new Collection<Feature>());
      //this.selectedFeature.set(null);
    });
  }

  private refreshLayers(): void {
    this.layers.set(this.map.getAllLayers().slice(1));
    if (untracked(() => this.layers().length) !== 0) {
      this.selectLayer(untracked(() => this.layers()[0] as VectorLayer));
    }
  }

  private showFeatureTooltip(feature: Feature, coordinate: Coordinate): void {
    const geom = feature.getGeometry() as Geometry;
    const type = geom?.getType();
    const projection = this.map.getView().getProjection();
    let html = '';

    if (type === 'Point') {
      const coord = toLonLat((geom as Point).getCoordinates(), projection);
      html = `Координаты: ${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`;
    } else if (type?.includes('Line')) {
      const length = getLength(geom, { projection });
      html = `Длина: ${(length / 1000).toFixed(2)} км`;
    } else if (type?.includes('Polygon')) {
      const area = getArea(geom, { projection });
      html = `Площадь: ${(area / 1_000_000).toFixed(2)} км²`;
    } else if (type?.includes('Circle')) {
      const area = getArea(fromCircle(geom as Circle, 64), { projection });
      html = `Площадь: ${(area / 1_000_000).toFixed(2)} км²`;
    }
    this.tooltip.show(
      coordinate,
      `${new FeaturePipe().transform(feature)}<br/>` + html
    );
  }

  private hideFeatureTooltip(): void {
    this.tooltip.hide();
  }

  private refreshUniteOptions(selectedFeature: Feature | null): void {
    if (
      !selectedFeature ||
      selectedFeature.getGeometry()?.getType() !== 'Polygon'
    ) {
      this.uniteOptions = [];
      return;
    }

    this.uniteOptions = untracked(() =>
      this.tempLayer
        .get('source')
        .getFeatures()
        .filter(
          (f: Feature) =>
            f !== selectedFeature &&
            f.getGeometry()?.getType() === 'Polygon' &&
            this.intersecting(selectedFeature, f)
        )
        .map((f: Feature) => {
          return { value: f, label: new FeaturePipe().transform(f) };
        })
    );
  }

  private intersecting(feature1: Feature, feature2: Feature): boolean {
    const parsed1 = this.geojson.writeFeatureObject(feature1);
    const parsed2 = this.geojson.writeFeatureObject(feature2);
    return turf.booleanIntersects(parsed1, parsed2);
  }

  private unitePolygons(feature1: Feature, feature2: Feature): Feature {
    const parsed1 = this.geojson.writeFeatureObject(feature1);
    const parsed2 = this.geojson.writeFeatureObject(feature2);
    const union = turf.union(
      this.geojson.writeFeaturesObject([
        feature1,
        feature2,
      ]) as FeatureCollection<Polygon | MultiPolygon>
    );
    return this.geojson.readFeature(union) as Feature;
  }
}
