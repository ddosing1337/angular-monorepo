import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  model,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-list',
  imports: [CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  public options = input<any[]>();
  public optionTemplate = model<TemplateRef<any> | null>(null);
}
