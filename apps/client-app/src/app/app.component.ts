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
import { Collection, Feature, getUid, Map, View } from 'ol';
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
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'client-app';
  public map!: Map;
  public layers: Array<Layer> = [];
  public selectedLayer = signal<Layer | null>(null);
  public layerEditActive = signal<boolean>(false);
  public selectedEditOption = signal<FeatureType>(FeatureType.None);
  public addLayerActive = signal<boolean>(false);
  public newLayerName = signal<string>('');
  public layerEditOptions!: SelectOption[];
  public featuresArray: WritableSignal<Array<Feature>> = signal([]);
  public tempLayer!: VectorLayer;
  private draw!: Draw;

  constructor(private zone: NgZone) {
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
    this.refreshLayers();
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
    this.map.addLayer(newLayer);
    this.refreshLayers();
    this.addLayerActive.set(false);
    this.newLayerName.set('');
  }

  public deleteLayer(): void {
    this.map.removeLayer(
      untracked(() => {
        return this.selectedLayer() as BaseLayer;
      })
    );
    this.refreshLayers();
  }

  public editLayer(): void {
    this.tempLayer = new VectorLayer({
      source: new VectorSource({
        features: new Collection<Feature>(),
        wrapX: false,
      }),
    });
    this.map.addLayer(this.tempLayer);
    this.layerEditActive.set(true);
  }

  public selectLayer(layer: Layer): void {
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
    this.layerEditActive.set(false);
    this.selectedEditOption.set(FeatureType.None);
  }

  public saveLayer(): void {
    untracked(() => {
      this.selectedLayer()
        ?.get('source')
        .addFeatures(this.tempLayer.get('source').getFeatures());
      this.map.removeLayer(this.tempLayer);
      this.featuresArray.set(this.selectedLayer()?.get('source').getFeatures());
    });
    this.layerEditActive.set(false);
    this.selectedEditOption.set(FeatureType.None);
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
    this.layers = this.map.getAllLayers().slice(1);
    if (this.layers.length !== 0) {
      this.selectLayer(this.layers[0]);
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
