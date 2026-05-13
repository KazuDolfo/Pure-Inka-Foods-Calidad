import { Injectable, signal, effect, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Cliente, AuthResponse } from '../../models/cliente.model';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../../models/api.models';
import { CartService } from '../cart.service';

const AUTH_API_URL = `${environment.apiUrl}/auth`;

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface RegisterRequest {
  nombre: string;
  correo: string;
  contrasena: string;
  telefono: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentCliente = signal<Cliente | null>(null);
  private token = signal<string | null>(null);
  readonly isAuthenticated = signal(false);
  private injector = inject(Injector);

  constructor(private http: HttpClient) {
    this.loadAuthFromStorage();

    effect(() => {
      const token = this.token();
      this.isAuthenticated.set(!!token);
      if (!token) this.currentCliente.set(null);
    });
  }

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${AUTH_API_URL}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthResponse(response.data);
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return of({ success: false, message: 'Error de autenticación', data: null as any });
      })
    );
  }

  register(userData: RegisterRequest): Observable<ApiResponse<Cliente>> {
    return this.http.post<ApiResponse<Cliente>>(`${AUTH_API_URL}/register`, userData).pipe(
      catchError(error => {
        console.error('Error en registro:', error);
        return of({ success: false, message: 'Error en registro', data: null as any });
      })
    );
  }

  forgotPassword(telefono: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${AUTH_API_URL}/forgot-password`, { telefono });
  }

  resetPassword(data: { telefono: string, codigo: string, nuevaContrasena: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${AUTH_API_URL}/reset-password`, data);
  }

  logout(): void {
    const cartService = this.injector.get(CartService);
    cartService.clearLocalCart();

    this.token.set(null);
    this.currentCliente.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return this.token();
  }

  getCurrentCliente(): Cliente | null {
    return this.currentCliente();
  }

  getCurrentUser(): Cliente | null {
    return this.currentCliente();
  }

  isAuthenticatedUser(): boolean {
    return !!this.token();
  }

  isAdmin(): boolean {
    const user = this.currentCliente();
    return user?.rol === 'admin';
  }

  private handleAuthResponse(response: AuthResponse): void {
    if (response?.token && response?.user) {
      this.token.set(response.token);
      
      const cliente: Cliente = {
        idCliente: response.user.idCliente,
        id_usuario: response.user.idCliente,
        nombre: response.user.nombre,
        correo: response.user.correo,
        email: response.user.correo,
        rol: response.user.rol || 'cliente',
        telefono: '', 
        activo: true
      };
      this.currentCliente.set(cliente);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(cliente));
      
      const cartService = this.injector.get(CartService);
      cartService.syncCartOnLogin();
    }
  }

  private loadAuthFromStorage(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token) this.token.set(token);
    if (user) this.currentCliente.set(JSON.parse(user) as Cliente);
  }
}
