import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCard } from '../../components/product-card/product-card';
import { ProductService } from 'services/product.service';
import { CartService } from 'services/cart.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, from } from 'rxjs';
import { PageHeader } from '../../components/page-header/page-header';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, ProductCard, FormsModule, PageHeader],
  templateUrl: './shop.html',
  styleUrls: ['./shop.scss'],
})
export class Shop implements OnInit, OnDestroy {
  searchTerm: string = '';
  selectedCategoryId: number | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<{ term: string; categoryId: number | null }>();

  getProducts = () => this.productService.getProducts();
  getCategories = () => this.productService.getCategories();
  getLoading = () => this.productService.isLoadingProducts();
  getLoadingCategories = () => this.productService.isLoadingCategories();
  getError = () => this.productService.getErrorProducts();
  getErrorCategories = () => this.productService.getErrorCategories();

  constructor(
    public cartService: CartService,
    private productService: ProductService
  ) {
    
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (prev, curr) => prev.term === curr.term && prev.categoryId === curr.categoryId
        ),
        switchMap(({ term, categoryId }) =>
          from(this.productService.loadProducts(1, 12, term, categoryId))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (error) => console.error('Error en filtro de productos:', error),
      });
  }

  async ngOnInit(): Promise<void> {
    await this.productService.loadCategories();
    await this.productService.loadProducts(1, 12);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(): void {
    this.emitFilter();
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedCategoryId = value ? parseInt(value, 10) : null;
    this.emitFilter();
  }

  
  private emitFilter(): void {
    this.searchSubject$.next({
      term: this.searchTerm.trim(),
      categoryId: this.selectedCategoryId,
    });
  }

  
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.emitFilter();
  }
}
