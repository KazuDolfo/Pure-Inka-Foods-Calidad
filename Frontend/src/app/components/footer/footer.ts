
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  
  currentYear: number = new Date().getFullYear();
  
  
  contactInfo = {
    email: 'pureinkafoods@gmail.com',
    phone: '+1 217-919-0170',
    social: {
      facebook: '#',
      instagram: '#',
      twitter: '#'
    }
  };
}