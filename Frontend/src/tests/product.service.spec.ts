
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from '../services/product.service';
import { environment } from '../environments/environment';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load products successfully', async () => {
    const mockProducts = [
      { idProducto: 1, nombre: 'Producto 1', precio: 10 },
      { idProducto: 2, nombre: 'Producto 2', precio: 20 }
    ];
    const mockResponse = {
      success: true,
      data: mockProducts
    };

    const promise = service.loadProducts();
    
    const req = httpMock.expectOne(request => request.url === `${environment.apiUrl}/products`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    await promise;

    expect(service.getProducts()).toEqual(mockProducts as any);
    expect(service.isLoadingProducts()).toBeFalse();
  });

  it('should handle error when loading products', async () => {
    const mockResponse = {
      success: false,
      message: 'Error logic'
    };

    const promise = service.loadProducts();
    
    const req = httpMock.expectOne(request => request.url === `${environment.apiUrl}/products`);
    req.flush(mockResponse);

    await promise;

    expect(service.getErrorProducts()).toBe('Error logic');
    expect(service.getProducts()).toEqual([]);
  });
});
