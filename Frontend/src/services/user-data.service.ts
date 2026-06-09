import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth/auth.service';
import { Pedido, DetallePedido, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders() {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getOrders(): Observable<Pedido[]> {
    
    return this.http.get<ApiResponse<Pedido[]>>(`${this.API_URL}/orders/my-orders`, { headers: this.getHeaders() }).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('Error cargando pedidos:', err);
        return throwError(() => err);
      })
    );
  }

  getOrderDetails(orderId: number): Observable<DetallePedido[]> {
    
    return this.http.get<ApiResponse<DetallePedido[]>>(`${this.API_URL}/orders/${orderId}`, { headers: this.getHeaders() }).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('Error cargando detalles del pedido:', err);
        return throwError(() => err);
      })
    );
  }

  cancelOrder(orderId: number): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.API_URL}/orders/${orderId}/cancel`, {}, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.error('Error al cancelar pedido:', err);
        return throwError(() => err);
      })
    );
  }

  
  getMessages(): Observable<any[]> { return new Observable(sub => sub.next([])); }
  getDistributorRequests(): Observable<any[]> { return new Observable(sub => sub.next([])); }
  getPendingRefunds(): Observable<any[]> { return new Observable(sub => sub.next([])); }
  requestRefund(orderId: number, reason: string): Observable<any> {
    return new Observable(sub => sub.next({ success: true }));
  }
}
