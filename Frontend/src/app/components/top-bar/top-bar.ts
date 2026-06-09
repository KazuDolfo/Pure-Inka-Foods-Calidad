import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss'
})
export class TopBarComponent {
  cartItems = computed(() => this.cartService.getCartItems());

  cartItemCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  cartTotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  aggregatedCartItems = computed(() => this.cartService.getAggregatedItems());
  isAuthenticated = computed(() => this.authService.isAuthenticatedUser());
  isDistributor = computed(() => this.authService.getCurrentUser()?.rol === 'distribuidor');
  showCartDropdown = signal(false);

  constructor(
    public cartService: CartService,
    public authService: AuthService,
    private router: Router
  ) {
    effect(() => {
      if (this.isAuthenticated()) {
        this.cartService.syncCartOnLogin();
      }
    });
  }

  private findCartItem(itemId: number) {
    return this.cartItems().find(item => item.id === itemId);
  }

  toggleCartDropdown(): void {
    this.showCartDropdown.set(!this.showCartDropdown());
  }

  closeCartDropdown(): void {
    this.showCartDropdown.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  removeItem(itemId: number): void {
    this.cartService.removeFromCart(itemId);
  }

  increaseQuantity(itemId: number): void {
    const item = this.findCartItem(itemId);
    if (item) {
      this.cartService.updateQuantity(itemId, item.quantity + 1);
    }
  }

  decreaseQuantity(itemId: number): void {
    const item = this.findCartItem(itemId);
    if (!item) {
      return;
    }

    if (item.quantity > 1) {
      this.cartService.updateQuantity(itemId, item.quantity - 1);
    } else {
      this.removeItem(itemId);
    }
  }

  get formattedCartTotal(): string {
    return `S/. ${this.cartTotal().toFixed(2)}`;
  }

  private normalizeImageUrl(image?: string): string {
    if (!image) {
      return 'assets/pure-inka-logo.png';
    }

    if (image.startsWith('http')) {
      return image;
    }

    if (image.includes('assets/')) {
      return image;
    }

    if (!image.includes('/')) {
      return `http://localhost:5000/uploads/products/${image}`;
    }

    return `assets/${image}`;
  }

  getImageUrl(image?: string): string {
    return this.normalizeImageUrl(image);
  }

  onImageError(event: any): void {
    if (event?.target) {
      event.target.src = 'assets/pure-inka-logo.png';
    }
  }
}
