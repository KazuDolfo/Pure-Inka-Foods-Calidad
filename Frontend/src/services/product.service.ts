import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Producto, Categoria, Proveedor, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products = signal<Producto[]>([]);
  private categories = signal<Categoria[]>([]);
  private proveedores = signal<Proveedor[]>([]);
  private loading = signal(false);
  private loadingCategories = signal(false);
  private error = signal<string | null>(null);
  private errorCategories = signal<string | null>(null);

  private API_URL = `${environment.apiUrl}/products`;
  private CAT_API_URL = `${environment.apiUrl}/categories`;
  private PROV_API_URL = `${environment.apiUrl}/proveedores`;

  constructor(private http: HttpClient) {}

  async loadProducts(page: number = 1, limit: number = 12, term?: string, categoryId?: number | null, sort: string = 'newest'): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sort', sort);
    
    if (term) params = params.set('search', term);
    if (categoryId) params = params.set('category', categoryId.toString());

    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Producto[]>>(this.API_URL, { params })
      );

      if (response.success) {
        this.products.set(response.data);
      } else {
        this.error.set(response.message || 'Error al cargar productos');
      }
    } catch (err: any) {
      this.error.set(err.message || 'Error de conexión');
    } finally {
      this.loading.set(false);
    }
  }

  async loadCategories(): Promise<void> {
    this.loadingCategories.set(true);
    this.errorCategories.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Categoria[]>>(this.CAT_API_URL)
      );

      if (response.success) {
        this.categories.set(response.data);
      } else {
        this.errorCategories.set(response.message || 'Error al cargar categorías');
      }
    } catch (err: any) {
      this.errorCategories.set(err.message || 'Error de conexión');
    } finally {
      this.loadingCategories.set(false);
    }
  }

  async loadProveedores(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Proveedor[]>>(this.PROV_API_URL)
      );
      if (response.success) {
        this.proveedores.set(response.data);
      }
    } catch (err) {
      console.error('Error cargando proveedores', err);
    }
  }

  getProductById(id: number): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.API_URL}/${id}`);
  }

  getRelatedProducts(id: number): Observable<ApiResponse<Producto[]>> {
    return this.http.get<ApiResponse<Producto[]>>(`${this.API_URL}/${id}/related`);
  }

  
  getProducts = () => this.products();
  getCategories = () => this.categories();
  getProveedores = () => this.proveedores();
  
  isLoadingProducts = () => this.loading();
  isLoadingCategories = () => this.loadingCategories();
  
  getErrorProducts = () => this.error();
  getErrorCategories = () => this.errorCategories();

  
  isLoading = () => this.loading();
  getError = () => this.error();

  getProductReviews(idProducto: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/reviews/product/${idProducto}`);
  }

  addReview(reviewData: { idProducto: number, calificacion: number, comentario: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/reviews`, reviewData);
  }
}
