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
import { Geometry, Point } from 'ol/geom';
import {
  debounceTime,
  fromEventPattern,
  Subject,
  takeUntil,
  throttleTime,
  timer,
} from 'rxjs';

enum FeatureType {
  None = 'None',
  Point = 'Point',
  LineString = 'LineString',
  Polygon = 'Polygon',
  //feat: add circly compatibility
  //Circle = 'Circle',
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'client-app';
  public map!: Map;
  public layers = signal<Array<Layer>>([]);
  public selectedLayer = signal<VectorLayer | null>(null); //
  public layerEditActive = signal<boolean>(false);
  public selectedEditOption = signal<FeatureType>(FeatureType.None);
  public addLayerActive = signal<boolean>(false);
  public newLayerName = signal<string>('');
  public layerEditOptions!: SelectOption[];
  public featuresArray: WritableSignal<Array<Feature>> = signal([]);
  public tempLayer!: VectorLayer;
  private destroy$ = new Subject();
  private draw!: Draw;
  private transform!: Transform;
  private tooltip!: Tooltip;

  constructor(private zone: NgZone, private layersService: LayersService) {
    effect(() => {
      this.map.removeInteraction(this.draw);
      this.addInteraction(this.selectedEditOption());
    });
  }

  ngOnInit(): void {
    this.initMap();
    this.layerEditOptions = Object.entries(FeatureType).map((e) => {
      return { label: e[0], value: e[1] };
    });
  }

  ngOnDestroy() {
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
    this.map.on('singleclick', (evt) => {
      if (untracked(() => this.layerEditActive())) {
        return;
      }
      let found = false;
      this.map.forEachFeatureAtPixel(evt.pixel, (feature) => {
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
        }
        this.tooltip.show(evt.coordinate, html);
        found = true;
        return true;
      });

      if (!found) {
        this.tooltip.hide();
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
        features: new Collection<Feature>(),
        wrapX: false,
      }),
    });
    this.map.addLayer(this.tempLayer);

    this.transform = new Transform({
      layers: [this.tempLayer, untracked(() => this.selectedLayer())!],
      translate: true,
      scale: true,
      rotate: true,
      enableRotatedTransform: true,
    });
    this.map.addInteraction(this.transform);

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
    this.selectedEditOption.set(FeatureType.None);
  }

  public saveLayer(): void {
    untracked(() => {
      this.selectedLayer()
        ?.get('source')
        .addFeatures(this.tempLayer.get('source').getFeatures());
      this.layersService.updateLayer(this.selectedLayer()!).subscribe((res) => {
        //feat: handle saving error
        this.map.removeLayer(this.tempLayer);
        this.featuresArray.set(
          this.selectedLayer()?.get('source').getFeatures()
        );
        this.map.removeInteraction(this.transform);
        this.layerEditActive.set(false);
        this.selectedEditOption.set(FeatureType.None);
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

  private refreshLayers(): void {
    this.layers.set(this.map.getAllLayers().slice(1));
    if (untracked(() => this.layers().length) !== 0) {
      this.selectLayer(untracked(() => this.layers()[0] as VectorLayer));
    }
  }
}

// const raster = new TileLayer({
//   source: new OSM(),
// });

// const source = new VectorSource({wrapX: false});

// const vector = new VectorLayer({
//   source: source,
// });

// const map = new Map({
//   layers: [raster, vector],
//   target: 'map',
//   view: new View({
//     center: [-11000000, 4600000],
//     zoom: 4,
//   }),
// });

// const typeSelect = document.getElementById('type');

// let draw; // global so we can remove it later
// function addInteraction() {
//   const value = typeSelect.value;
//   if (value !== 'None') {
//     draw = new Draw({
//       source: source,
//       type: typeSelect.value,
//     });
//     map.addInteraction(draw);
//   }
// }

// /**
//  * Handle change event.
//  */
// typeSelect.onchange = function () {
//   map.removeInteraction(draw);
//   addInteraction();
// };

// document.getElementById('undo').addEventListener('click', function () {
//   draw.removeLastPoint();
// });

// addInteraction();
