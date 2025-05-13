import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from './components/hero/hero.component';
import { HeaderComponent } from './components/header/header.component';
import { CaseStudiesComponent } from './components/case-studies/case-studies.component';
import { FooterComponent } from './components/footer/footer.component';
import { TeamComponent } from './components/team/team.component';
import { PricingComponent } from './components/pricing/pricing.component';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    HeroComponent,
    HeaderComponent,
    CaseStudiesComponent,
    FooterComponent,
    TeamComponent,
    PricingComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
