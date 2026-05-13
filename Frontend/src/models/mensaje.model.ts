
export interface Mensaje {
  idMensaje: number;
  nombre: string;
  correo: string;
  asunto: string;
  contenido: string;
  fecha: Date;
  leido: boolean;
  respuesta?: string;
  fecha_respuesta?: Date | string;

  
  id_mensaje: number;
  nombre_remitente: string;
  email_remitente: string;
  fecha_recepcion: Date;
  id_usuario?: number;
  usuario_rol?: string;
}

export type MessageSummary = Mensaje;
