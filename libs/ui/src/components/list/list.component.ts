import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListOption } from '../../interfaces/list-option.interface';

@Component({
  selector: 'ui-list',
  imports: [CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  public options = input<ListOption[]>([]);
  public activeOption = model<number>(0);
}
