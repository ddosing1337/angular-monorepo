import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
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

  constructor(private cdr: ChangeDetectorRef) {
    effect(() => {
      const options = this.options();
      if (options?.length) {
        this.selected.set(options[0].value);
      }
    });
  }

  public onSelectionChange(event: Event): void {
    this.selected.set((event.target as HTMLSelectElement).value);
  }

  ngOnChanges(): void {
    this.cdr.markForCheck();
  }
}
