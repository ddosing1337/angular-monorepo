import { Pipe, PipeTransform } from '@angular/core';
import { Feature, getUid } from 'ol';
import { FeatureLike } from 'ol/Feature';

@Pipe({
  name: 'FeaturePipe',
})
export class FeaturePipe implements PipeTransform {
  transform(feature: Feature | FeatureLike): string {
    const id = feature.get('id') ? feature.get('id') : getUid(feature) + '*';
    return `${feature.getGeometry()?.getType()}-${id}`;
  }
}
