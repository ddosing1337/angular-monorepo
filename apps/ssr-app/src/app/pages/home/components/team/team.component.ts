import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team',
  imports: [CommonModule],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamComponent {
  public teamMembers = [
    {
      name: 'John Doe',
      position: 'CEO',
      description:
        'John is the visionary behind the company, leading the team with dedication and expertise.',
      photoUrl: 'assets/images/team-image.png',
    },
    {
      name: 'Jane Smith',
      position: 'CTO',
      description:
        'Jane is the technical leader, overseeing the development of our cutting-edge technologies.',
      photoUrl: 'assets/images/team-image.png',
    },
    {
      name: 'Michael Brown',
      position: 'Lead Designer',
      description:
        'Michael brings creativity to life with his exceptional design skills and innovative approach.',
      photoUrl: 'assets/images/team-image.png',
    },
  ];
}
