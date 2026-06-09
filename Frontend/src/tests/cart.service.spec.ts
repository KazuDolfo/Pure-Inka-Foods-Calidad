
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth/auth.service';
import { authInterceptor } from '../services/auth/auth.interceptor';

describe('CartService', () => {
  let service: CartService;
  let authServiceMock: any;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    authServiceMock = {
      getToken: jasmine.createSpy('getToken').and.returnValue(null)
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        CartService,
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    localStorage.clear();
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add items to cart', () => {
    const product = { idProducto: 1, nombre: 'Test Prod', precio: 10, stock: 5 };
    service.addToCart(product as any);
    
    expect(service.getCartCount()).toBe(1);
    expect(service.getCartTotal()).toBe(10);
  });

  it('should update quantity of existing items', () => {
    const product = { idProducto: 1, nombre: 'Test Prod', precio: 10, stock: 5 };
    service.addToCart(product as any);
    service.addToCart(product as any);
    
    expect(service.getCartCount()).toBe(2);
    expect(service.getCartTotal()).toBe(20);
  });

  it('should not add more than stock', () => {
    const product = { idProducto: 1, nombre: 'Test Prod', precio: 10, stock: 1 };
    service.addToCart(product as any);
    service.addToCart(product as any); // Should be ignored
    
    expect(service.getCartCount()).toBe(1);
  });

  it('should remove items from cart', () => {
    const product = { idProducto: 1, nombre: 'Test Prod', precio: 10, stock: 5 };
    service.addToCart(product as any);
    service.removeFromCart(1);
    
    expect(service.getCartCount()).toBe(0);
  });

  it('should sync cart on login', async () => {
    const mockServerCart = {
      success: true,
      data: [
        { idProducto: 1, nombre: 'Server Prod', precio: 15, cantidad: 2, imagen: 'test.jpg' }
      ]
    };
    
    authServiceMock.getToken.and.returnValue('mock-token');
    localStorage.setItem('token', 'mock-token'); // Needed for the interceptor
    
    service.syncCartOnLogin();
    
    const req = httpMock.expectOne('http://localhost:5000/api/cart');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    
    req.flush(mockServerCart);
    
    expect(service.getCartCount()).toBe(2);
    expect(service.getCartTotal()).toBe(30);
  });
});
