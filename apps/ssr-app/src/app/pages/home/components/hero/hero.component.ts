import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment as env } from 'src/environments/environment';

@Component({
  selector: 'app-hero',
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  constructor(private router: Router) {}

  public onTryOn() {
    // this.router.navigateByUrl(env.clientUrl, {skipLocationChange: true});
    window.location.href = env.clientUrl;
  }
}
