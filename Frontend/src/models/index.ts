
export * from './api.models';
export * from './categoria.model';
export * from './producto.model';
export * from './cliente.model';
export * from './pedido.model';
export * from './mensaje.model';
export * from './devolucion.model';
export * from './direccion.model';
export * from './proveedor.model';
export * from './usuario.model';


export interface CartItem {
  product: import('./producto.model').Producto;
  quantity: number;
  
  
  id: number;
  id_carrito_item?: number;
  name: string;
  price: number;
  image?: string;
  total: number; 
}

export interface SolicitudDistribuidor {
    id: number;
    idCliente: number;
    mensaje: string;
    estado: string;
}
