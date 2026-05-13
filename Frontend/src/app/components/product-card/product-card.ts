
import { Component, Input, computed } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Producto } from '../../../models';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  @Input({ required: true }) product!: Producto;

  protected readonly formattedPrice = computed(() => {
    
    const rawPrice = this.product.precio ?? (this.product as any).price;
    const price = Number(rawPrice);
    
    if (isNaN(price)) {
      console.warn('Precio inválido detectado:', this.product);
      return 'S/. 0.00';
    }
    return `S/. ${price.toFixed(2)}`;
  });

  isAdded = false;

  get isOutOfStock(): boolean {
    return (this.product.stock ?? 0) <= 0;
  }

  get isLowStock(): boolean {
    return (this.product.stock ?? 0) > 0 && (this.product.stock ?? 0) <= 5;
  }

  constructor(private cartService: CartService) {}

  onAddToCart(): void {
    if (this.isOutOfStock) return;
    this.cartService.addToCart(this.product);
    this.isAdded = true;
    setTimeout(() => {
      this.isAdded = false;
    }, 1500);
  }

  isProductInCart = computed(() => {
    const cartItems = this.cartService.getCartItems();
    const id = this.product.idProducto || (this.product as any).id;
    return cartItems.some(item => (item as any).id === id || item.product.idProducto === id);
  });

  productQuantityInCart = computed(() => {
    const cartItems = this.cartService.getCartItems();
    const id = this.product.idProducto || (this.product as any).id;
    const item = cartItems.find(cartItem => (cartItem as any).id === id || cartItem.product.idProducto === id);
    return (item as any)?.quantity || 0;
  });

  getImageUrl(): string {
    const image = this.product.imagen || (this.product as any).image;
    if (!image) {
      return 'assets/pure-inka-logo.png';
    }

    if (image.startsWith('http')) {
      return image;
    }

    if (image.startsWith('uploads/')) {
      return `http://localhost:5000/${image}`;
    }

    if (!image.includes('/')) {
      return `http://localhost:5000/uploads/products/${image}`;
    }

    return `assets/${image}`;
  }

  onImageError(event: any): void {
    if (event?.target) {
      event.target.src = 'assets/pure-inka-logo.png';
    }
  }
}
