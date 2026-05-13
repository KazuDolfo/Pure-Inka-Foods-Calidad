
import { Categoria } from './categoria.model';

export interface Producto {
  idProducto: number;
  idCategoria: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen?: string;
  activo: boolean;
  categoriaNombre?: string;
  categoria?: Categoria;

  
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  rating?: number;
  isNew?: boolean;
  id_categoria?: number;
}

export type Product = Producto;
