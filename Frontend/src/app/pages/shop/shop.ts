import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, from } from 'rxjs';
import { PageHeaderComponent } from '../../components/page-header/page-header';
import { Product } from '../../../models';
import { AuthService } from '../../../services/auth/auth.service';

interface SearchPayload {
  term: string;
  categoryId: number | null;
  sort: string;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, FormsModule, PageHeaderComponent],
  templateUrl: './shop.html',
  styleUrls: ['./shop.scss'],
})
export class Shop implements OnInit, OnDestroy {
  searchTerm = '';
  selectedCategoryId: number | null = null;
  selectedSort = 'newest';
  selectedProduct: Product | null = null;
  relatedProducts: Product[] = [];
  isLoadingRelated = false;

  // Reviews variables
  reviewsList: any[] = [];
  averageRating = 0;
  totalReviews = 0;
  userRating = 5;
  userComment = '';
  isSubmittingReview = false;
  reviewStatusMessage = '';
  reviewErrorMessage = '';

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<SearchPayload>();

  constructor(
    public cartService: CartService,
    private productService: ProductService,
    public authService: AuthService
  ) {
    this.initializeSearchSubscription();
  }

  get products(): Product[] {
    return this.productService.getProducts();
  }

  get categories(): any[] {
    return this.productService.getCategories();
  }

  get isLoadingProducts(): boolean {
    return this.productService.isLoadingProducts();
  }

  get isLoadingCategories(): boolean {
    return this.productService.isLoadingCategories();
  }

  get productsError(): string | null {
    return this.productService.getErrorProducts();
  }

  get categoriesError(): string | null {
    return this.productService.getErrorCategories();
  }

  getError(): string | null {
    return this.productsError;
  }

  getErrorCategories(): string | null {
    return this.categoriesError;
  }

  getLoading(): boolean {
    return this.isLoadingProducts;
  }

  getLoadingCategories(): boolean {
    return this.isLoadingCategories;
  }

  getCategories(): any[] {
    return this.categories;
  }

  getProducts(): Product[] {
    return this.products;
  }

  async ngOnInit(): Promise<void> {
    await this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(): void {
    this.emitSearchCriteria();
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategoryId = target.value ? parseInt(target.value, 10) : null;
    this.emitSearchCriteria();
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedSort = target.value;
    this.emitSearchCriteria();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.selectedSort = 'newest';
    this.emitSearchCriteria();
  }

  openProductDetail(product: Product): void {
    this.selectedProduct = product;
    this.relatedProducts = [];
    this.reviewStatusMessage = '';
    this.reviewErrorMessage = '';
    this.userComment = '';
    this.userRating = 5;
    const productId = this.getProductId(product);
    this.loadRelatedProducts(productId);
    this.loadReviews(productId);
  }

  closeProductDetail(): void {
    this.selectedProduct = null;
    this.relatedProducts = [];
    this.reviewsList = [];
    this.averageRating = 0;
    this.totalReviews = 0;
  }

  loadReviews(productId: number | undefined): void {
    if (!productId) {
      return;
    }
    this.productService.getProductReviews(productId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reviewsList = response.data.reviews || [];
          this.averageRating = response.data.promedio || 0;
          this.totalReviews = response.data.total || 0;
        }
      },
      error: (err) => console.error('Error loading reviews:', err)
    });
  }

  submitReview(): void {
    const productId = this.getProductId(this.selectedProduct!);
    if (!productId) {
      return;
    }

    this.isSubmittingReview = true;
    this.reviewStatusMessage = '';
    this.reviewErrorMessage = '';

    const reviewPayload = {
      idProducto: productId,
      calificacion: Number(this.userRating),
      comentario: this.userComment
    };

    this.productService.addReview(reviewPayload).subscribe({
      next: (response) => {
        this.isSubmittingReview = false;
        if (response.success) {
          this.reviewStatusMessage = response.message || 'Reseña registrada con éxito.';
          this.userComment = '';
          this.loadReviews(productId);
        } else {
          this.reviewErrorMessage = response.message || 'No se pudo registrar la reseña.';
        }
      },
      error: (err) => {
        this.isSubmittingReview = false;
        this.reviewErrorMessage = err.error?.message || 'Error al intentar registrar la reseña.';
      }
    });
  }

  getProductImage(image?: string): string {
    return this.formatProductImage(image);
  }

  private async loadInitialData(): Promise<void> {
    await this.productService.loadCategories();
    await this.productService.loadProducts(1, 12, '', null, this.selectedSort);
  }

  private initializeSearchSubscription(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (prev, curr) => prev.term === curr.term && prev.categoryId === curr.categoryId && prev.sort === curr.sort
        ),
        switchMap(({ term, categoryId, sort }) =>
          from(this.productService.loadProducts(1, 12, term, categoryId, sort))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (error) => this.logSearchError(error),
      });
  }

  private emitSearchCriteria(): void {
    this.searchSubject$.next({
      term: this.searchTerm.trim(),
      categoryId: this.selectedCategoryId,
      sort: this.selectedSort
    });
  }

  private logSearchError(error: any): void {
    console.error('Error en filtro de productos:', error);
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
