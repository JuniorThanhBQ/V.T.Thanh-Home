import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-comming-soon',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './comming-soon.component.html',
})
export class CommingSoonComponent {
  @Input() title = 'Coming Soon';
  @Input() subtitle =
    'This section is currently undergoing active engineering and will be deployed shortly.';
}
