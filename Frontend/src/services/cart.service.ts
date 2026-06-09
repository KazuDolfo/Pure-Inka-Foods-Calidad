import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Producto, CartItem } from '../models';
import { AuthService } from './auth/auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cart = signal<CartItem[]>([]);
  private API_URL = `${environment.apiUrl}/cart`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  constructor() {
    this.loadCartFromStorage();
  }

  getCartItems = () => this.cart();

  aggregatedItems = computed(() => {
    return this.cart().map(item => {
        const prod = item.product || {} as any;
        const price = item.price ?? prod.precio ?? prod.price ?? 0;
        const name = item.name ?? prod.nombre ?? prod.name ?? 'Producto';
        const image = item.image ?? prod.imagen ?? prod.image;
        
        return {
            ...item,
            name: name,
            price: Number(price),
            image: image,
            total: Number(price) * (item.quantity || 1)
        };
    });
  });

  getAggregatedItems = () => this.aggregatedItems();

  getCartCount = computed(() => 
    this.cart().reduce((sum, item) => sum + (item.quantity || 0), 0)
  );

  getCartTotal = computed(() => 
    this.aggregatedItems().reduce((sum, item) => sum + (item.total || 0), 0)
  );

  addToCart(product: Producto): void {
    const current = this.cart();
    const id = product.idProducto || product.id || (product as any).id_producto;
    const stock = Number(product.stock ?? 0);
    
    if (!id) {
        console.error('Cannot add product to cart: Missing ID', product);
        return;
    }

    if (stock <= 0) {
      console.warn('Cannot add product to cart: Out of stock');
      return;
    }

    const existingIndex = current.findIndex(item => item.id === id);

    if (existingIndex !== -1) {
      const newQuantity = current[existingIndex].quantity + 1;
      if (newQuantity > stock) {
        console.warn(`Cannot add more: Stock limit reached (${stock})`);
        return;
      }
      this.updateQuantity(id, newQuantity);
    } else {
      const price = Number(product.precio ?? (product as any).price ?? 0);
      const name = product.nombre ?? product.name ?? 'Producto';
      const image = product.imagen ?? product.image;

      const newItem: CartItem = {
        product: product,
        quantity: 1,
        id: id,
        name: name,
        price: price,
        image: image,
        total: price
      };
      
      this.cart.set([...current, newItem]);
      this.saveCartToStorage();
    }
  }

  removeFromCart(productId: number): void {
    this.cart.set(this.cart().filter(item => item.id !== productId));
    this.saveCartToStorage();
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const updated = this.cart().map(item => {
      if (item.id === productId) {
        const stock = Number(item.product?.stock ?? 0);
        const finalQuantity = quantity > stock ? stock : quantity;
        
        const price = Number(item.price || (item.product as any)?.precio || (item.product as any)?.price || 0);
        return { ...item, quantity: finalQuantity, total: price * finalQuantity };
      }
      return item;
    });
    
    this.cart.set(updated);
    this.saveCartToStorage();
  }

  async syncCartOnLogin(): Promise<void> {
    if (!this.authService.getToken()) return;

    try {
      const res: any = await firstValueFrom(this.http.get(this.API_URL));
      if (res.success && res.data && res.data.length > 0) {
        const serverItems: CartItem[] = res.data.map((item: any) => ({
          id: item.idProducto,
          quantity: item.cantidad,
          name: item.nombre,
          price: Number(item.precio),
          image: item.imagen,
          total: Number(item.precio) * item.cantidad,
          product: { idProducto: item.idProducto, nombre: item.nombre, precio: item.precio, imagen: item.imagen } as any
        }));
        this.cart.set(serverItems);
        localStorage.setItem('cart', JSON.stringify(serverItems));
      } else {
        await this.syncWithServer();
      }
    } catch (error) {
      console.error('Error al sincronizar carrito al login:', error);
    }
  }

  clearCart(): void {
    this.cart.set([]);
    localStorage.removeItem('cart');
    
    if (this.authService.getToken()) {
        this.http.delete(this.API_URL).subscribe({
            error: (err) => console.error('Error al vaciar carrito en servidor', err)
        });
    }
  }

  clearLocalCart(): void {
    this.cart.set([]);
    localStorage.removeItem('cart');
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
  }

  private syncTimeout: any;

  private saveCartToStorage(): void {
    const items = this.cart();
    localStorage.setItem('cart', JSON.stringify(items));
    
    if (this.authService.getToken()) {
        if (this.syncTimeout) clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => this.syncWithServer(), 500);
    }
  }

  private async syncWithServer() {
    try {
        await firstValueFrom(this.http.post(`${this.API_URL}/sync`, { items: this.cart() }));
    } catch (e) {
        console.error('Error sincronizando con servidor', e);
    }
  }

  private loadCartFromStorage(): void {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) parsed = [];
        const repaired = parsed.map((item: any) => {
            const id = item.id || item.product?.idProducto || item.product?.id;
            const price = item.price ?? item.product?.precio ?? item.product?.price ?? 0;
            return {
                ...item,
                id: id,
                price: Number(price),
                total: Number(price) * (item.quantity || 1)
            };
        });
        this.cart.set(repaired);
      } catch (e) {
        console.error('Error loading cart', e);
        this.cart.set([]);
      }
    }
  }
}
