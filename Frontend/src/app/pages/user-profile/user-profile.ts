

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth/auth.service';
import { UserDataService } from '../../../services/user-data.service';

import {
  Pedido,
  DetallePedido,
  Direccion
} from '../../../models';

interface ApiProfileResponse {
  success: boolean;
  data: ApiUser;
}

interface ApiUser {
  idCliente: number;
  nombre: string;
  correo: string;
  rol: string;
  telefono?: string;
  direcciones: Direccion[];
}

interface ApiUpdateResponse {
  success: boolean;
  message: string;
  data?: ApiUser;
}

interface OrderSummary extends Pedido {
  expanded: boolean;
  detalles?: DetallePedido[];
  isLoadingDetails?: boolean;
  error?: string;
  detailsLoaded?: boolean;
  boleta_url?: string;
  comprobantePago?: string;
  comprobante_pago?: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss'
})
export class UserProfile implements OnInit {

  activeTab: 'profile' | 'orders' | 'addresses' | 'tickets' = 'profile';

  userOrders: OrderSummary[] = [];

  userData = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    zipCode: ''
  };

  direcciones: Direccion[] = [];
  isEditing = false;
  isLoading = true;
  errorMessage: string | null = null;

  ordersError: string | null = null;

  tickets: any[] = [];
  ticketsLoading = false;
  ticketsError: string | null = null;

  newTicket = {
    asunto: '',
    descripcion: '',
    categoria: 'Soporte Técnico'
  };
  isSubmittingTicket = false;
  ticketMessage: string | null = null;
  ticketMessageType: 'success' | 'error' | null = null;

  showPasswordModal = false;
  passwordData = {
    current: '',
    new: '',
    confirm: ''
  };
  isChangingPassword = false;
  passwordMessage: string | null = null;
  passwordMessageType: 'success' | 'error' | null = null;

  showAddressModal = false;
  isEditingAddress = false;
  isSubmittingAddress = false;
  addressMessage: string | null = null;
  addressMessageType: 'success' | 'error' | null = null;

  newAddress: any = {
    nombre_receptor: '',
    telefono_receptor: '',
    direccion: '',
    distrito: '',
    referencia: '',
    pais: 'Perú',
    tipo: 'envio'
  };

  private API_URL = 'http://localhost:5000/api/users';

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private userDataService: UserDataService
  ) { }

  ngOnInit(): void {
    if (!this.authService.isAuthenticatedUser()) {
      this.errorMessage = 'Debes iniciar sesión para acceder a tu perfil.';
      this.isLoading = false;
      return;
    }
    this.loadUserProfile();
    this.setActiveTab('profile');
  }

  setActiveTab(tab: 'profile' | 'orders' | 'addresses' | 'tickets'): void {
    this.activeTab = tab;
    this.errorMessage = null;

    if (tab === 'orders' && this.userOrders.length === 0) {
      this.loadOrders();
    } else if (tab === 'tickets') {
      this.loadTickets();
    }
  }

  loadTickets(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.ticketsLoading = true;
    this.ticketsError = null;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>('http://localhost:5000/api/tickets/my-tickets', { headers }).subscribe({
      next: (res) => {
        this.tickets = res.data || [];
        this.ticketsLoading = false;
      },
      error: (err) => {
        this.ticketsError = err.error?.message || 'Error al cargar los tickets.';
        this.ticketsLoading = false;
      }
    });
  }

  submitTicket(): void {
    const token = this.authService.getToken();
    if (!token) return;

    if (!this.newTicket.asunto || !this.newTicket.descripcion) {
      this.ticketMessage = 'Por favor completa todos los campos.';
      this.ticketMessageType = 'error';
      return;
    }

    this.isSubmittingTicket = true;
    this.ticketMessage = null;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.post<any>('http://localhost:5000/api/tickets', this.newTicket, { headers }).subscribe({
      next: (res) => {
        this.isSubmittingTicket = false;
        this.ticketMessage = 'Ticket creado exitosamente.';
        this.ticketMessageType = 'success';
        this.newTicket = { asunto: '', descripcion: '', categoria: 'Soporte Técnico' };
        this.loadTickets();
      },
      error: (err) => {
        this.isSubmittingTicket = false;
        this.ticketMessage = err.error?.message || 'Error al enviar el ticket.';
        this.ticketMessageType = 'error';
      }
    });
  }

  loadOrders(): void {
    this.ordersError = null;
    this.userDataService.getOrders().subscribe({
      next: (data: Pedido[]) => {
        this.userOrders = data.map((order: any) => ({
          ...order,
          expanded: false,
          detailsLoaded: false
        }));
      },
      error: (err: any) => { this.ordersError = err.message; }
    });
  }

  toggleDetails(item: OrderSummary): void {
    item.expanded = !item.expanded;

    if (item.expanded && !item.detailsLoaded) {
      item.isLoadingDetails = true;
      const id = item.idPedido || item.id_pedido;
      this.userDataService.getOrderDetails(id).subscribe({
        next: (details: DetallePedido[]) => {
          item.detalles = details;
          item.detailsLoaded = true;
          item.isLoadingDetails = false;
        },
        error: (err: any) => {
          item.error = 'No se pudieron cargar los detalles.';
          item.isLoadingDetails = false;
        }
      });
    }
  }

  cancelOrder(id: number): void {
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido? Esta acción devolverá los productos al stock.')) {
      return;
    }

    this.userDataService.cancelOrder(id).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Pedido cancelado correctamente.');
          this.loadOrders(); // Recargar la lista para ver el cambio de estado
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Error al cancelar el pedido.');
      }
    });
  }

  loadUserProfile(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.errorMessage = 'Sesión no válida. Por favor, inicia sesión nuevamente.';
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<ApiProfileResponse>(`${this.API_URL}/profile`, { headers }).subscribe({
      next: (response: ApiProfileResponse) => {
        if (response.success && response.data) {
          const user = response.data;
          this.userData = {
            fullName: user.nombre,
            email: user.correo,
            phone: user.telefono || '',
            address: '',
            city: '',
            country: 'Perú',
            zipCode: ''
          };

          this.direcciones = user.direcciones || [];
          const principal = this.direcciones.find(d => d.esPrincipal);
          if (principal) {
            this.userData.address = principal.direccion;
          }
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar perfil:', err);
        this.errorMessage = err.error?.message || 'No se pudo cargar tu perfil';
        this.isLoading = false;
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.errorMessage = null;
  }

  saveChanges(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const updateData = {
      nombre: this.userData.fullName,
      telefono: this.userData.phone
    };

    this.http.put<ApiUpdateResponse>(`${this.API_URL}/profile`, updateData, { headers }).subscribe({
      next: (response: ApiUpdateResponse) => {
        if (response.success) {
          this.isEditing = false;
          alert('¡Tus datos han sido actualizados!');
        } else {
          this.errorMessage = response.message || 'Error al actualizar';
        }
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'No se pudo guardar los cambios';
      }
    });
  }

  
  openPasswordModal(): void {
    this.passwordData = { current: '', new: '', confirm: '' };
    this.passwordMessage = null;
    this.passwordMessageType = null;
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  changePassword(): void {
    if (!this.passwordData.current || !this.passwordData.new || !this.passwordData.confirm) {
      this.passwordMessage = 'Todos los campos son obligatorios.';
      this.passwordMessageType = 'error';
      return;
    }

    if (this.passwordData.new !== this.passwordData.confirm) {
      this.passwordMessage = 'Las contraseñas nuevas no coinciden.';
      this.passwordMessageType = 'error';
      return;
    }

    const token = this.authService.getToken();
    if (!token) return;

    this.isChangingPassword = true;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.post<any>(`${this.API_URL}/change-password`, {
      oldPassword: this.passwordData.current,
      newPassword: this.passwordData.new
    }, { headers }).subscribe({
      next: (response: any) => {
        this.isChangingPassword = false;
        if (response.success) {
          this.passwordMessage = '¡Contraseña actualizada!';
          this.passwordMessageType = 'success';
          setTimeout(() => this.closePasswordModal(), 1500);
        } else {
          this.passwordMessage = response.message || 'Error';
          this.passwordMessageType = 'error';
        }
      },
      error: (err: any) => {
        this.isChangingPassword = false;
        this.passwordMessage = err.error?.message || 'Error';
        this.passwordMessageType = 'error';
      }
    });
  }

  
  openAddressModal(): void {
    this.newAddress = {
      nombre_receptor: this.userData.fullName,
      telefono_receptor: this.userData.phone,
      direccion: '',
      distrito: '',
      referencia: '',
      pais: 'Perú',
      tipo: 'envio'
    };
    this.isEditingAddress = false;
    this.addressMessage = null;
    this.showAddressModal = true;
  }

  openEditAddressModal(dir: Direccion): void {
    this.newAddress = { ...dir };
    this.isEditingAddress = true;
    this.addressMessage = null;
    this.showAddressModal = true;
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
  }

  saveAddress(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.isSubmittingAddress = true;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const id = this.newAddress.idDireccion || this.newAddress.id_direccion;

    if (this.isEditingAddress && id) {
      this.http.put<any>(`${this.API_URL}/addresses/${id}`, this.newAddress, { headers }).subscribe({
        next: (response) => {
          this.isSubmittingAddress = false;
          if (response.success) {
            this.addressMessage = 'Dirección actualizada correctamente.';
            this.addressMessageType = 'success';
            this.loadUserProfile();
            setTimeout(() => this.closeAddressModal(), 1500);
          }
        },
        error: (err) => {
          this.isSubmittingAddress = false;
          this.addressMessage = err.error?.message || 'Error';
          this.addressMessageType = 'error';
        }
      });
    } else {
      this.http.post<any>(`${this.API_URL}/addresses`, this.newAddress, { headers }).subscribe({
        next: (response) => {
          this.isSubmittingAddress = false;
          if (response.success) {
            this.addressMessage = 'Dirección agregada correctamente.';
            this.addressMessageType = 'success';
            this.loadUserProfile();
            setTimeout(() => this.closeAddressModal(), 1500);
          }
        },
        error: (err) => {
          this.isSubmittingAddress = false;
          this.addressMessage = err.error?.message || 'Error';
          this.addressMessageType = 'error';
        }
      });
    }
  }

  deleteAddress(id: number): void {
    if (!confirm('¿Eliminar dirección?')) return;
    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.delete<any>(`${this.API_URL}/addresses/${id}`, { headers }).subscribe({
      next: (res) => { if (res.success) this.loadUserProfile(); }
    });
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/auth';
  }
}
