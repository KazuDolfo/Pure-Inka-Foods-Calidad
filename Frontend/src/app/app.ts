import { Component, signal } from '@angular/core';

import { Router, RouterOutlet } from '@angular/router';
import { TopBar } from './components/top-bar/top-bar';
import { Header } from './components/header/header';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    TopBar,
    Header,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  
  constructor(private router: Router) {}

  protected readonly title = signal('INKAPT');
  
  
  
  get isAdminRoute(): boolean {
    
    return this.router.url.startsWith('/admin');
  }
}