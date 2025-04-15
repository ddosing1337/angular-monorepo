import { Pipe, PipeTransform } from '@angular/core';
import { Feature, getUid } from 'ol';

@Pipe({
  name: 'FeaturePipe',
})
export class FeaturePipe implements PipeTransform {
  transform(feature: Feature): string {
    return `${feature.getGeometry()?.getType()}-${getUid(feature)}`;
  }
}
