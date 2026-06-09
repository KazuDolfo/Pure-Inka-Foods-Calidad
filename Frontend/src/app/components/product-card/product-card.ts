
import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../models';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Producto;
  @Output() viewDetail = new EventEmitter<Producto>();

  protected readonly formattedPrice = computed(() => `S/. ${this.productPrice.toFixed(2)}`);
  isAdded = false;

  constructor(private cartService: CartService) {}

  private get productPrice(): number {
    const rawPrice = this.product.precio ?? (this.product as any).price ?? 0;
    const parsedPrice = Number(rawPrice);
    if (Number.isNaN(parsedPrice)) {
      console.warn('Precio inválido detectado:', this.product);
      return 0;
    }
    return parsedPrice;
  }

  private get productId(): number | string | undefined {
    return this.product.idProducto ?? (this.product as any).id;
  }

  private get stockAmount(): number {
    return Number(this.product.stock ?? 0);
  }

  get isOutOfStock(): boolean {
    return this.stockAmount <= 0;
  }

  get isLowStock(): boolean {
    return this.stockAmount > 0 && this.stockAmount <= 5;
  }

  private getCartItems() {
    return this.cartService.getCartItems();
  }

  private findCartItem() {
    const id = this.productId;
    return this.getCartItems().find(
      item => (item as any).id === id || (item as any).product?.idProducto === id
    );
  }

  isProductInCart = computed(() => Boolean(this.findCartItem()));

  productQuantityInCart = computed(() => this.findCartItem()?.quantity || 0);

  onAddToCart(): void {
    if (this.isOutOfStock) {
      return;
    }

    this.cartService.addToCart(this.product);
    this.isAdded = true;

    setTimeout(() => {
      this.isAdded = false;
    }, 1500);
  }

  onViewDetail(): void {
    this.viewDetail.emit(this.product);
  }

  private normalizeImageUrl(image?: string): string {
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

  getImageUrl(): string {
    return this.normalizeImageUrl(this.product.imagen ?? (this.product as any).image);
  }

  onImageError(event: any): void {
    if (event?.target) {
      event.target.src = 'assets/pure-inka-logo.png';
    }
  }
}
