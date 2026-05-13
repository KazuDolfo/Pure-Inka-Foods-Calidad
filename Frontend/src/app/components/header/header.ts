
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service'; 

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  isMobileMenuOpen = signal(false);
  
  
  private authService = inject(AuthService);
  private router = inject(Router);

  
  get homeLink(): string {
    
    return this.authService.isAdmin() ? '/admin' : '/';
  }

  
  get isDistributor(): boolean {
    return this.authService.getCurrentUser()?.rol === 'distribuidor';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  
  
  navigateToHome(): void {
    this.router.navigate([this.homeLink]);
    this.closeMobileMenu();
  }
}