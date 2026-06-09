import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-card.html',
  styleUrl: './info-card.scss'
})
export class InfoCardComponent {
  @Input() iconClass = '';
  @Input() title = '';
  @Input() content = '';
}
