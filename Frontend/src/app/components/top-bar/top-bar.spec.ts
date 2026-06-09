import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TopBarComponent } from './top-bar';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth/auth.service';

describe('TopBarComponent', () => {
  let component: TopBarComponent;
  let fixture: ComponentFixture<TopBarComponent>;
  let cartServiceMock: any;
  let authServiceMock: any;

  beforeEach(async () => {
    cartServiceMock = {
      getCartItems: jasmine.createSpy('getCartItems').and.returnValue([]),
      getAggregatedItems: jasmine.createSpy('getAggregatedItems').and.returnValue([]),
      syncCartOnLogin: jasmine.createSpy('syncCartOnLogin'),
      removeFromCart: jasmine.createSpy('removeFromCart'),
      updateQuantity: jasmine.createSpy('updateQuantity')
    };

    authServiceMock = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
      isAuthenticatedUser: jasmine.createSpy('isAuthenticatedUser').and.returnValue(false),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(null),
      logout: jasmine.createSpy('logout')
    };

    await TestBed.configureTestingModule({
      imports: [TopBarComponent, RouterTestingModule],
      providers: [
        { provide: CartService, useValue: cartServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
