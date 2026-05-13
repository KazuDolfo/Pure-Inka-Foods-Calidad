
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductCard } from '../../components/product-card/product-card';
import { Product } from '../../../models';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  featuredProducts: Product[] = [];
  loading = false;
  error: string | null = null;

  constructor(private productService: ProductService) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      await this.productService.loadProducts(1, 4);
      this.featuredProducts = this.productService.getProducts().slice(0, 4);
    } catch (err) {
      this.error = 'No se pudieron cargar los productos destacados.';
      console.error('Error en Home:', err);
    } finally {
      this.loading = false;
    }
  }
}