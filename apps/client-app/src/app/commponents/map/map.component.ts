import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Map } from 'ol';

@Component({
  selector: 'app-map',
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
})
export class MapComponent {
  map = input<Map>();
}
