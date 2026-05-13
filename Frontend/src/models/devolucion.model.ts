
export type EstadoDevolucion = 'pendiente' | 'aprobada' | 'rechazada' | 'completada';

export interface Devolucion {
  idDevolucion: number;
  idPedido: number;
  motivo: string;
  fecha_solicitud: Date | string;
  estado: EstadoDevolucion;
  monto_reembolso?: number;
  fecha_resolucion?: Date | string;

  
  id_devolucion: number;
  id_pedido: number;
  tipo: string;
  estado_producto: string;
  cantidad: number;
  monto_reembolsado: number; 
}

export type DevolucionAdmin = Devolucion;
export type RefundSummary = Devolucion;
