import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pedido, EstadoPedido } from '../../../../models/pedido.model';

import { AdminService, PedidoAdmin } from '../../../../services/admin.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.scss']
})
export class Orders implements OnInit {
  
  orders: any[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  readonly estadosPedido: EstadoPedido[] = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

  selectedImage: string | null = null;

  constructor(private admin: AdminService) { }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.admin.getOrders().subscribe(data => {
      console.log('📦 Pedidos cargados en admin:', data);
      this.orders = data || [];
      this.loading = false;
    }, err => {
      console.error('❌ Error cargando pedidos:', err);
      this.error = 'Error al cargar pedidos';
      this.loading = false;
    });
  }

  updateStatus(order: any, nuevoEstado: string) {
    const id = order.idPedido || order.id_pedido;
    console.log('🔄 Solicitando cambio de estado:', { id, nuevoEstado, orderOriginal: order });
    
    if (!id) {
        console.error('❌ Error: ID de pedido no encontrado en el objeto:', order);
        this.error = 'Error: ID de pedido no encontrado';
        return;
    }

    this.admin.updateOrderStatus(id, nuevoEstado).subscribe({
      next: (res) => {
        console.log('✅ Respuesta del servidor:', res);
        this.successMessage = `Pedido #${id} actualizado a ${nuevoEstado}`;
        this.load(); 
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('❌ Error en actualización:', err);
        this.error = 'Error al actualizar el estado: ' + (err.error?.message || err.message);
        setTimeout(() => this.error = null, 3000);
      }
    });
  }

  viewImage(imageName: string) {
    if (!imageName) return;
    this.selectedImage = `http://localhost:5000/uploads/${imageName}`;
  }

  closeImageModal() {
    this.selectedImage = null;
  }
}