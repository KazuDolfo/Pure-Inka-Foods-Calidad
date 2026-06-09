
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../services/auth/auth.service';
import { environment } from '../environments/environment';
import { CartService } from '../services/cart.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let cartServiceMock: any;

  beforeEach(() => {
    cartServiceMock = {
      clearLocalCart: jasmine.createSpy('clearLocalCart'),
      syncCartOnLogin: jasmine.createSpy('syncCartOnLogin')
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: CartService, useValue: cartServiceMock }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', () => {
    const mockResponse = {
      success: true,
      message: 'Login success',
      data: {
        token: 'fake-token',
        user: {
          idCliente: 1,
          nombre: 'Test User',
          correo: 'test@example.com',
          rol: 'cliente'
        }
      }
    };

    service.login({ correo: 'test@example.com', contrasena: 'password' }).subscribe(response => {
      expect(response.success).toBeTrue();
      expect(service.getToken()).toBe('fake-token');
      expect(service.isAuthenticatedUser()).toBeTrue();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should logout correctly', () => {
    localStorage.setItem('token', 'fake-token');
    
    // We need to trigger the private loadAuthFromStorage or just rely on the effect
    // But logout is explicit
    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticatedUser()).toBeFalse();
    expect(cartServiceMock.clearLocalCart).toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
