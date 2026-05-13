
export interface Pedido {
  idPedido: number;
  idCliente: number;
  idTipoEntrega: number;
  idDireccion?: number;
  fecha: Date;
  estado: string;
  totalProductos: number;
  costoEnvio: number;
  totalPagar: number;
  
  
  id_pedido: number;
  fecha_pedido: Date;
  total: number;
  comprobante_pago?: string;
  detalles?: any[];
  expanded?: boolean;
  detailsLoaded?: boolean;
  isLoadingDetails?: boolean;
  error?: string;
}


export type OrderSummary = Pedido;
export type PedidoAdmin = Pedido;
export type EstadoPedido = string;

export interface DetallePedido {
  idDetalle: number;
  idPedido: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  
  
  producto_nombre?: string;
  precio_unitario?: number; 
  imagen?: string;
}
