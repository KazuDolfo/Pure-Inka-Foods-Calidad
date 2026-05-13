import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';
import { Pedido, Devolucion, Mensaje, Usuario } from '../models';

const API_BASE_URL = 'http://localhost:5000/api';

export interface PedidoAdmin extends Pedido {
  usuario?: Pick<Usuario, 'nombre' | 'correo' | 'telefono'>;
}

export interface DevolucionAdmin extends Devolucion {
  usuario?: Pick<Usuario, 'nombre' | 'correo' | 'telefono'>;
  infoPedido?: {
    total: number;
    fecha_pedido: string;
  };
  expanded?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient, private auth: AuthService) { }

  private authHeaders() {
    const token = this.auth.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  
  getDashboardStats(period: number = 7): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/admin/dashboard-stats?period=${period}`, { headers: this.authHeaders() }).pipe(
      map(res => res.data || res),
      catchError(err => throwError(() => new Error(err.error?.message || 'Fallo al obtener estadísticas')))
    );
  }

  
  getMessages(): Observable<Mensaje[]> {
    return this.http.get<any>(`${API_BASE_URL}/admin/messages`, { headers: this.authHeaders() }).pipe(
      map(res => res.data || res),
      catchError(err => throwError(() => new Error(err.error?.message || 'Fallo al obtener mensajes')))
    );
  }

  deleteMessage(id: number): Observable<any> {
    return this.http.delete(`${API_BASE_URL}/admin/messages/${id}`, { headers: this.authHeaders() }).pipe(
      catchError(err => throwError(() => new Error(err.error?.message || 'Fallo al eliminar el mensaje')))
    );
  }

  markMessageAsRead(id: number): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/admin/messages/${id}/read`, {}, { headers: this.authHeaders() }).pipe(
      catchError(err => throwError(() => new Error(err.error?.message || 'Fallo al marcar como leído')))
    );
  }

  replyMessage(id: number, respuesta: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/admin/messages/${id}/reply`, { respuesta }, { headers: this.authHeaders() }).pipe(
      catchError(err => throwError(() => new Error(err.error?.message || 'Fallo al enviar respuesta')))
    );
  }

  
  getDistributorRequests(): Observable<any[]> {
    return this.http.get<any>(`${API_BASE_URL}/admin/distributor-requests`, { headers: this.authHeaders() }).pipe(
      map(res => res.data || res),
      catchError(err => throwError(() => new Error('Fallo al obtener solicitudes')))
    );
  }

  approveDistributor(id: number): Observable<any> {
    return this.http.post(`${API_BASE_URL}/admin/distributor-requests/${id}/approve`, {}, { headers: this.authHeaders() });
  }

  rejectDistributor(id: number): Observable<any> {
    return this.http.post(`${API_BASE_URL}/admin/distributor-requests/${id}/reject`, {}, { headers: this.authHeaders() });
  }

  
  getOrders(): Observable<PedidoAdmin[]> {
    return this.http.get<any>(`${API_BASE_URL}/admin/orders`, { headers: this.authHeaders() }).pipe(
      map(res => res.data || res),
      catchError(err => throwError(() => new Error('Fallo al obtener pedidos')))
    );
  }

  updateOrderStatus(id: number, estado: string): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/admin/orders/${id}/status`, { estado }, { headers: this.authHeaders() });
  }

  
  getRefunds(): Observable<DevolucionAdmin[]> {
    return this.http.get<any>(`${API_BASE_URL}/admin/refunds`, { headers: this.authHeaders() }).pipe(
      map(res => res.data || res),
      catchError(err => throwError(() => new Error('Fallo al obtener reembolsos')))
    );
  }

  updateRefundStatus(id: number, estado: string, estado_producto?: string, monto_reembolsado?: number): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/admin/refunds/${id}/status`, { estado, estado_producto, monto_reembolsado }, { headers: this.authHeaders() });
  }

  
  addCategory(categoryData: any): Observable<any> {
    return this.http.post(`${API_BASE_URL}/categories`, categoryData, { headers: this.authHeaders() }).pipe(
      catchError(err => throwError(() => new Error(err.error?.message || 'Fallo al crear categoría')))
    );
  }

  
  addProduct(productData: FormData): Observable<any> {
    return this.http.post(`${API_BASE_URL}/products`, productData, { headers: this.authHeaders() }).pipe(
      catchError(err => throwError(() => new Error(err.error?.message || 'Fallo al crear producto')))
    );
  }

  updateProduct(id: number, productData: any): Observable<any> {
    return this.http.put(`${API_BASE_URL}/products/${id}`, productData, { headers: this.authHeaders() }).pipe(
      catchError(err => throwError(() => new Error(err.error?.message || 'Fallo al actualizar producto')))
    );
  }

  updateStock(id: number, cantidad: number): Observable<any> {
    return this.http.put(`${API_BASE_URL}/products/${id}/stock`, { cantidad }, { headers: this.authHeaders() }).pipe(
      catchError(err => throwError(() => new Error(err.error?.message || 'Fallo al actualizar stock')))
    );
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${API_BASE_URL}/products/${id}`, { headers: this.authHeaders() }).pipe(
      catchError(err => throwError(() => new Error(err.error?.message || 'Fallo al eliminar producto')))
    );
  }
}
