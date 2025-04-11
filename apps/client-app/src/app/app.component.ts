import { Component, effect, signal, untracked } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  ButtonComponent,
  ListComponent,
  ModalComponent,
  SelectComponent,
  TextFieldComponent,
} from '@angular-monorepo/ui';
import { MapComponent } from './commponents/map/map.component';
import { Map, View } from 'ol';
import Draw from 'ol/interaction/Draw';
import { defaults, FullScreen } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import BaseLayer from 'ol/layer/Base';
import { CommonModule } from '@angular/common';
import { SelectOption } from 'libs/ui/src/interfaces/select-option.interface';

enum FeatureType {
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
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'client-app';
  public map!: Map;
  public layers: BaseLayer[] = [];
  public selectedLayer = signal<BaseLayer | null>(null);
  public layerEditActive = signal<boolean>(false);
  public selectedEditOption = signal<any>(null);
  public addLayerActive = signal<boolean>(false);
  public newLayerName = signal<string>('');
  public layerEditOptions!: SelectOption[];
  private draw!: Draw;

  constructor() {
    effect(() => {
      console.log('effect');
      console.log(this.selectedEditOption());
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

    this.map = new Map({
      controls: defaults().extend([new FullScreen()]),
      target: 'map',
      layers: [rasterLayer],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });
    this.refreshLayers();
  }

  public addLayer(): void {
    const newLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
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

  public deleteLayer(layer: BaseLayer): void {
    this.map.removeLayer(layer);
    this.refreshLayers();
  }

  public editLayer(layer: BaseLayer): void {
    console.log(`edit`);
    console.log(layer.get('source'));
    this.layerEditActive.set(true);
  }

  public selectLayer(layer: BaseLayer): void {
    //question
    if (layer !== untracked(() => this.selectedLayer())) {
      this.cancelLayerEdit();
      this.selectedLayer.set(layer);
    }
  }

  public cancelLayerEdit(): void {
    this.layerEditActive.set(false);
  }

  public saveLayer(): void {
    this.layerEditActive.set(false);
  }

  private refreshLayers() {
    this.layers = Array.from(this.map.getLayers().getArray()).slice(1);
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
