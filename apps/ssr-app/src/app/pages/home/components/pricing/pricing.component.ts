import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing',
  imports: [CommonModule],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
})
export class PricingComponent {
  public plans = [
    {
      title: 'Basic Plan',
      price: '$500',
      features: [
        'Website optimization',
        'Social media setup and management (1 platform)',
        'Monthly progress report',
        'Email support',
        'Basic competitor analysis',
        'Initial SEO audit',
      ],
      isHighlighted: false,
    },
    {
      title: 'Pro Plan',
      price: '$1000',
      features: [
        'Includes all from the Basic Plan',
        'Social media setup and management (up to 3 platforms)',
        'PPC ad campaign management',
        'Email and phone support',
        'On-page SEO improvements',
        'Monthly content recommendations',
      ],
      isHighlighted: true,
      badge: 'Popular',
    },
    {
      title: 'Elite Plan',
      price: '$2000',
      features: [
        'Includes all from the Pro Plan',
        'Website design and development',
        'Comprehensive SEO strategy',
        'Social media setup and management (up to 5 platforms)',
        'Content marketing strategy and implementation',
        'In-depth analytics and reporting',
      ],
      isHighlighted: false,
    },
  ];
}
