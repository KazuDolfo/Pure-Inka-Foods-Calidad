import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isSidebarOpen = signal(false);
  private readonly mobileBreakpoint = 992;

  toggleSidebar(): void {
    this.isSidebarOpen.update((value) => !value);
  }

  closeSidebarOnMobile(): void {
    if (this.isMobileViewport()) {
      this.isSidebarOpen.set(false);
    }
  }

  private isMobileViewport(): boolean {
    return window.innerWidth < this.mobileBreakpoint;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}