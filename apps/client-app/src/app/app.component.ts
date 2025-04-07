import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  ButtonComponent,
  ListComponent,
  ModalComponent,
} from '@angular-monorepo/ui';
import { MapComponent } from './commponents/map/map.component';
import { getUid, Map, View } from 'ol';
import { defaults, FullScreen } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import { ListOption } from 'libs/ui/src/interfaces/list-option.interface';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

@Component({
  imports: [
    RouterModule,
    ButtonComponent,
    MapComponent,
    ListComponent,
    ModalComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'client-app';
  public map!: Map;
  public layers!: ListOption[];
  public addLayerActive = false;

  ngOnInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = new Map({
      controls: defaults().extend([new FullScreen()]),
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });
    this.refreshLayers();
  }

  private refreshLayers(): void {
    this.layers = this.map
      .getLayers()
      .getArray()
      .map((e) => {
        e.set('name', `Layer with id = ${getUid(e)}`);
        return { id: getUid(e), title: e.get('name') };
      });
  }

  public onAddLayer(): void {
    this.addLayerActive = true;
    // this.map.addLayer(
    //   new VectorLayer({
    //     source: new VectorSource({ wrapX: false }),
    //   })
    // );
    // this.refreshLayers();
    // console.log(this.map.getLayers().getArray());
  }
}
