
export interface Cliente {
  idCliente: number;
  id_usuario?: number; 
  nombre: string;
  correo: string;
  email?: string;      
  telefono: string;
  rol?: 'cliente' | 'admin' | 'distribuidor';
  activo: boolean;
  fechaRegistro?: Date;
}

export interface AuthResponse {
  token: string;
  user: Cliente;
}
