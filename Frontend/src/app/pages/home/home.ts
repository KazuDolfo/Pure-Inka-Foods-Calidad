
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { Product } from '../../../models';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  featuredProducts: Product[] = [];
  loading = false;
  error: string | null = null;

  selectedProduct: Product | null = null;
  relatedProducts: Product[] = [];
  isLoadingRelated = false;

  constructor(
    private productService: ProductService,
    public cartService: CartService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadFeaturedProducts();
  }

  private async loadFeaturedProducts(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      await this.productService.loadProducts(1, 4);
      this.featuredProducts = this.productService.getProducts().slice(0, 4);
    } catch (error) {
      this.error = 'No se pudieron cargar los productos destacados.';
      console.error('Error en Home:', error);
    } finally {
      this.loading = false;
    }
  }

  openProductDetail(product: Product): void {
    this.selectedProduct = product;
    this.relatedProducts = [];
    this.loadRelatedProducts(this.getProductId(product));
  }

  private getProductId(product: Product): number | undefined {
    const rawId = product.idProducto ?? (product as any).id;
    const normalizedId = Number(rawId);
    return Number.isFinite(normalizedId) ? normalizedId : undefined;
  }

  private loadRelatedProducts(productId: number | undefined): void {
    if (!productId) {
      return;
    }

    this.isLoadingRelated = true;
    this.productService.getRelatedProducts(productId).subscribe({
      next: (response) => {
        if (response.success) {
          this.relatedProducts = response.data;
        }
        this.isLoadingRelated = false;
      },
      error: (error) => {
        console.error('Error al cargar productos relacionados:', error);
        this.isLoadingRelated = false;
      }
    });
  }

  closeProductDetail(): void {
    this.selectedProduct = null;
    this.relatedProducts = [];
  }

  getProductImage(image?: string): string {
    return this.formatProductImage(image);
  }

  private formatProductImage(image?: string): string {
    if (!image) {
      return 'assets/pure-inka-logo.png';
    }

    if (image.startsWith('http')) {
      return image;
    }

    return `http://localhost:5000/uploads/products/${image}`;
  }
}