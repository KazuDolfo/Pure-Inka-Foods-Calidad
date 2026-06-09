import { Routes } from '@angular/router';
import { authGuard } from '../services/auth/auth.guard';
import { adminGuard } from '../services/auth/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home), title: 'Inicio' },
  { path: 'shop', loadComponent: () => import('./pages/shop/shop').then(m => m.Shop), title: 'Tienda' },
  { path: 'about', loadComponent: () => import('./pages/about/about').then(m => m.About), title: 'Nosotros' },
  { path: 'user-profile', loadComponent: () => import('./pages/user-profile/user-profile').then(m => m.UserProfile), canActivate: [authGuard], title: 'Mi Perfil' },
  { path: 'auth', loadComponent: () => import('./pages/auth/auth').then(m => m.Auth), title: 'Acceso' },
  { path: 'auth/forgot-password', loadComponent: () => import('./pages/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent), title: 'Recuperar Contraseña' },
  { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout').then(m => m.Checkout), canActivate: [authGuard], title: 'Checkout' },

  
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then(m => m.AdminPage),
    canActivate: [adminGuard],
    children: [
      
      { path: 'home', loadComponent: () => import('./pages/admin/home/home').then(m => m.AdminHomeComponent), title: 'Admin - Inicio' },
      { path: 'orders', loadComponent: () => import('./pages/admin/orders/orders').then(m => m.Orders), title: 'Admin - Pedidos' },
      { path: 'products', loadComponent: () => import('./pages/admin/products/products').then(m => m.ProductsComponent), title: 'Admin - Productos' },
      { path: 'payment-methods', loadComponent: () => import('./pages/admin/payment-methods/payment-methods').then(m => m.PaymentMethodsComponent), title: 'Admin - Métodos de Pago' },
      { path: 'coupons', loadComponent: () => import('./pages/admin/coupons/coupons').then(m => m.CouponsComponent), title: 'Admin - Cupones' },
      { path: 'tickets', loadComponent: () => import('./pages/admin/tickets/tickets').then(m => m.TicketsComponent), title: 'Admin - Tickets' },

      { path: '', redirectTo: 'home', pathMatch: 'full' } 
    ]
  },

  
  { path: '**', redirectTo: '' }
];