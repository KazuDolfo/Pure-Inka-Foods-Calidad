import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCardComponent } from './product-card';
import { CartService } from '../../../services/cart.service';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;
  let cartServiceMock: any;

  beforeEach(async () => {
    cartServiceMock = {
      getCartItems: jasmine.createSpy('getCartItems').and.returnValue([]),
      addToCart: jasmine.createSpy('addToCart')
    };

    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        { provide: CartService, useValue: cartServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    
    // Set a mock product before detectChanges
    component.product = {
      idProducto: 1,
      idCategoria: 1,
      nombre: 'Test Product',
      precio: 100,
      stock: 10,
      activo: true,
      descripcion: 'Test Description',
      id_categoria: 1,
      id: 1,
      name: 'Test Product',
      description: 'Test Description',
      price: 100
    };
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
