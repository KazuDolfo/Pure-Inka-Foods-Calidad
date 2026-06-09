import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../../services/auth/auth.service';

interface Ticket {
  idTicket: number;
  idCliente: number;
  asunto: string;
  descripcion: string;
  categoria: string;
  estado: string;
  respuesta: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  cliente_nombre?: string;
  cliente_correo?: string;
}

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.html'
})
export class TicketsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  tickets = signal<Ticket[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Response inputs
  selectedTicket = signal<Ticket | null>(null);
  responseText = '';
  responseStatus = 'RESPONDIDO';

  private readonly TICKETS_API = `${environment.apiUrl}/tickets`;

  ngOnInit(): void {
    this.loadTickets();
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

  async loadTickets(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.TICKETS_API}/admin/all`, this.getAuthHeaders())
      );
      if (response.success) {
        this.tickets.set(response.data);
      }
    } catch (error: any) {
      console.error('Error loading admin tickets:', error);
      this.errorMessage.set(error.error?.message || 'Error al cargar los tickets.');
    } finally {
      this.isLoading.set(false);
    }
  }

  selectTicket(ticket: Ticket): void {
    this.selectedTicket.set(ticket);
    this.responseText = ticket.respuesta || '';
    this.responseStatus = ticket.estado;
  }

  closeResponseModal(): void {
    this.selectedTicket.set(null);
    this.responseText = '';
  }

  async submitResponse(): Promise<void> {
    const ticket = this.selectedTicket();
    if (!ticket) return;

    if (!this.responseText.trim()) {
      this.showError('La respuesta no puede estar vacía.');
      return;
    }

    try {
      const response: any = await firstValueFrom(
        this.http.put(
          `${this.TICKETS_API}/admin/respond/${ticket.idTicket}`,
          {
            respuesta: this.responseText,
            estado: this.responseStatus
          },
          this.getAuthHeaders()
        )
      );

      if (response.success) {
        this.showSuccess('Ticket actualizado con éxito.');
        this.closeResponseModal();
        this.loadTickets();
      }
    } catch (error: any) {
      console.error('Error responding to ticket:', error);
      this.showError(error.error?.message || 'Error al actualizar el ticket.');
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
