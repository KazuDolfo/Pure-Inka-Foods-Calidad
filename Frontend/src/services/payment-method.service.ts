import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth/auth.service';

export interface PaymentMethod {
    id_metodo: number;
    idMetodoPago?: number;
    nombre: string;
    descripcion?: string;
    imagen_qr?: string;
    activo: boolean | number;
    instrucciones?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentMethodService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private apiUrl = `${environment.apiUrl}/payment-methods`;

    private getHeaders() {
        const token = this.auth.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getActiveMethods(): Observable<PaymentMethod[]> {
        return this.http.get<{success: boolean, data: PaymentMethod[]}>(`${this.apiUrl}/active`)
            .pipe(map(res => res.data));
    }

    getAllMethods(): Observable<PaymentMethod[]> {
        return this.http.get<{success: boolean, data: PaymentMethod[]}>(this.apiUrl, { headers: this.getHeaders() })
            .pipe(map(res => res.data));
    }

    createMethod(data: FormData): Observable<any> {
        return this.http.post(this.apiUrl, data, { headers: this.getHeaders() });
    }

    updateMethod(id: number, data: FormData): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
    }

    deleteMethod(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }
}
