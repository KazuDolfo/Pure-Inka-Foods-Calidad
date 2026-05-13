
export type TipoDireccion = 'casa' | 'trabajo' | 'otro' | 'envio';

export interface Direccion {
  idDireccion: number;
  idCliente: number;
  direccion: string;
  referencia?: string;
  distrito: string;
  esPrincipal: boolean;
  tipo?: TipoDireccion;

  
  id_direccion: number;
  nombre_receptor: string;
  ciudad: string;
  pais: string;
  codigo_postal: string;
  telefono_receptor: string;
}

export interface RequestSummary {
    id: number;
    region_deseada: string;
    tipo_negocio: string;
    mensaje: string;
    fecha_solicitud: Date;
    estado: string;
}
