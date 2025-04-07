import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonComponent, ListComponent } from '@angular-monorepo/ui';
import { MapComponent } from './commponents/map/map.component';
import { getUid, Map, View } from 'ol';
import { defaults, FullScreen } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import { ListOption } from 'libs/ui/src/interfaces/list-option.interface';

@Component({
  imports: [RouterModule, ButtonComponent, MapComponent, ListComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'client-app';
  public map!: Map;
  public layers!: ListOption[];

  ngOnInit() {
    this.initMap();
  }

  private initMap() {
    // this.map
    //   .getLayers()
    //   .getArray()
    //   .forEach((elem, index) => {
    //     elem.set('name', `Layer ${index}`);
    //   });
    this.map = new Map({
      controls: defaults().extend([new FullScreen()]),
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new TileLayer({
          source: new OSM(),
        }),
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });
    this.layers = this.map
      .getLayers()
      .getArray()
      .map((e) => {
        e.set('name', `Layer with id = ${getUid(e)}`);
        return { id: getUid(e), title: e.get('name') };
      });
  }
}
