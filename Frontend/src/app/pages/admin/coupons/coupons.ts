import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../../services/auth/auth.service';

interface Coupon {
  idCupon: number;
  codigo: string;
  tipo: string;
  valor: number;
  fechaExpiracion: string;
  activo: boolean | number;
  limiteUso: number;
  vecesUsado: number;
}

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.html'
})
export class CouponsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  coupons = signal<Coupon[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // New coupon form variables
  newCode = '';
  newType = 'porcentaje';
  newValue = 10;
  newExpiryDate = '';
  newLimit = 100;
  isSaving = signal(false);

  private readonly ADMIN_API = `${environment.apiUrl}/admin/coupons`;
  private readonly COUPONS_API = `${environment.apiUrl}/coupons`;

  ngOnInit(): void {
    this.loadCoupons();
    // Set a default expiry date (e.g. 1 year from now)
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    this.newExpiryDate = nextYear.toISOString().slice(0, 16); // format to yyyy-MM-ddThh:mm
  }

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  async loadCoupons(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const response: any = await firstValueFrom(
        this.http.get(this.ADMIN_API, this.getAuthHeaders())
      );
      if (response.success) {
        this.coupons.set(response.data);
      }
    } catch (error: any) {
      console.error('Error loading coupons:', error);
      this.errorMessage.set(error.error?.message || 'Error al cargar cupones.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleStatus(coupon: Coupon): Promise<void> {
    const targetStatus = coupon.activo ? 0 : 1;
    try {
      const response: any = await firstValueFrom(
        this.http.patch(
          `${this.ADMIN_API}/${coupon.idCupon}/status`,
          { activo: targetStatus },
          this.getAuthHeaders()
        )
      );
      if (response.success) {
        this.loadCoupons();
        this.showSuccess('Estado del cupón actualizado.');
      }
    } catch (error: any) {
      console.error('Error toggling coupon status:', error);
      this.showError(error.error?.message || 'Error al cambiar estado.');
    }
  }

  async createCoupon(): Promise<void> {
    if (!this.newCode.trim()) {
      this.showError('El código del cupón es requerido.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      // Convert HTML datetime-local format (yyyy-MM-ddThh:mm) to MySQL DATETIME format (yyyy-MM-dd hh:mm:ss)
      const formattedDate = this.newExpiryDate.replace('T', ' ') + ':00';

      const payload = {
        codigo: this.newCode.toUpperCase().trim(),
        tipo: this.newType,
        valor: this.newValue,
        fechaExpiracion: formattedDate,
        limiteUso: this.newLimit
      };

      const response: any = await firstValueFrom(
        this.http.post(this.COUPONS_API, payload, this.getAuthHeaders())
      );

      if (response.success) {
        this.showSuccess('Cupón registrado con éxito.');
        this.newCode = '';
        this.newValue = 10;
        this.newLimit = 100;
        this.loadCoupons();
      }
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      this.showError(error.error?.message || 'Error al registrar el cupón.');
    } finally {
      this.isSaving.set(false);
    }
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(null), 4000);
  }
}
