import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  ButtonComponent,
  ListComponent,
  ModalComponent,
  TextFieldComponent,
} from '@angular-monorepo/ui';
import { MapComponent } from './commponents/map/map.component';
import { Map, View } from 'ol';
import { defaults, FullScreen } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import BaseLayer from 'ol/layer/Base';
import { CommonModule } from '@angular/common';

@Component({
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    MapComponent,
    ListComponent,
    ModalComponent,
    TextFieldComponent,
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
  public addLayerActive = signal(false);
  public newLayerName = signal('');

  ngOnInit(): void {
    this.initMap();
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
    newLayer.set('name', this.newLayerName());
    this.map.addLayer(newLayer);
    this.refreshLayers();
    this.addLayerActive.set(false);
    this.newLayerName.set('');
  }

  public deleteLayer(layer: BaseLayer): void {
    this.map.removeLayer(layer);
    this.refreshLayers();
  }

  public editLayer(): void {}

  public selectLayer(layer: BaseLayer): void {
    this.selectedLayer.set(layer);
    console.log('selected', layer);
  }

  private refreshLayers() {
    this.layers = Array.from(this.map.getLayers().getArray()).slice(1);
    console.log(this.layers);
    if (this.layers.length !== 0) {
      this.selectLayer(this.layers[0]);
    }
  }
}
