import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectOption } from '../../interfaces/select-option.interface';

@Component({
  selector: 'ui-select',
  imports: [CommonModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent {
  public placeholder = input<string>();
  public options = input<SelectOption[]>();
  public selected = model<any>();

  public onSelectionChange(event: Event) {
    this.selected.set((event.target as HTMLSelectElement).value);
  }
}
