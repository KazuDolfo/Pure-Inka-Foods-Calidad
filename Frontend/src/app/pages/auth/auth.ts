import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth/auth.service';


interface ApiLoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      idCliente: number;
      nombre: string;
      correo: string;
      rol: 'cliente' | 'distribuidor' | 'admin';
    };
  };
}

interface ApiRegisterResponse {
  success: boolean;
  message: string;
  data: any;
}

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  currentView = signal<'login' | 'register'>('login');
  showAdminModal = signal(false);

  loginData: LoginForm = { email: '', password: '' };
  registerData: RegisterForm = { name: '', email: '', phone: '', password: '', confirmPassword: '' };
  adminLoginData = { email: '', password: '' };

  isSubmitting = false;
  authMessage: string | null = null;
  messageType: 'success' | 'error' | null = null;

  isSubmittingAdmin = false;
  adminAuthMessage: string | null = null;
  adminMessageType: 'success' | 'error' | null = null;

  private API_URL = 'http://localhost:5000/api/auth';
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  switchView(view: 'login' | 'register'): void {
    this.currentView.set(view);
    this.authMessage = null;
    this.messageType = null;
  }

  openAdminModal(): void {
    this.showAdminModal.set(true);
    this.adminAuthMessage = null;
    this.adminMessageType = null;
  }

  closeAdminModal(): void {
    this.showAdminModal.set(false);
  }

  signInAdmin(): void {
    if (!this.adminLoginData.email || !this.adminLoginData.password) {
      this.adminAuthMessage = 'Por favor, completa todos los campos.';
      this.adminMessageType = 'error';
      return;
    }

    this.isSubmittingAdmin = true;
    this.adminAuthMessage = null;

    const credentials = {
      correo: this.adminLoginData.email.trim().toLowerCase(),
      contrasena: this.adminLoginData.password
    };

    this.http.post<ApiLoginResponse>(`${this.API_URL}/login`, credentials).subscribe({
      next: (response) => {
        this.isSubmittingAdmin = false;
        if (response.success && response.data?.user) {
          const { user, token } = response.data;

          if (user.rol === 'admin') {
            this.authService['handleAuthResponse']({ token, user } as any);
            this.adminAuthMessage = '¡Acceso administrativo concedido!';
            this.adminMessageType = 'success';
            setTimeout(() => {
              this.closeAdminModal();
              this.router.navigate(['/admin']);
            }, 1500);
          } else {
            this.adminAuthMessage = 'Acceso denegado. No eres administrador.';
            this.adminMessageType = 'error';
          }
        } else {
          this.adminAuthMessage = response.message || 'Credenciales inválidas.';
          this.adminMessageType = 'error';
        }
      },
      error: (err) => {
        this.isSubmittingAdmin = false;
        this.adminAuthMessage = err.error?.message || 'Error de conexión';
        this.adminMessageType = 'error';
      }
    });
  }

  signIn(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.authMessage = 'Por favor, completa todos los campos.';
      this.messageType = 'error';
      return;
    }

    this.isSubmitting = true;
    this.authMessage = null;

    const credentials = {
      correo: this.loginData.email.trim().toLowerCase(),
      contrasena: this.loginData.password
    };

    this.http.post<ApiLoginResponse>(`${this.API_URL}/login`, credentials).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success && response.data?.user) {
          const { user, token } = response.data;
          
          if (user.rol === 'admin') {
            this.authMessage = 'Por favor usa el acceso para administradores.';
            this.messageType = 'error';
            return;
          }

          this.authService['handleAuthResponse']({ token, user } as any);
          this.authMessage = '¡Bienvenido de nuevo!';
          this.messageType = 'success';
          setTimeout(() => this.router.navigate(['/']), 1500);
        } else {
          this.authMessage = response.message || 'Credenciales inválidas.';
          this.messageType = 'error';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.authMessage = err.error?.message || 'Error de conexión';
        this.messageType = 'error';
      }
    });
  }

  signUp(): void {
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.authMessage = 'Las contraseñas no coinciden.';
      this.messageType = 'error';
      return;
    }

    this.isSubmitting = true;
    this.authMessage = null;

    const userData = {
      nombre: this.registerData.name,
      correo: this.registerData.email.trim().toLowerCase(),
      telefono: this.registerData.phone,
      contrasena: this.registerData.password,
      rol: 'cliente'
    };

    this.http.post<ApiRegisterResponse>(`${this.API_URL}/register`, userData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.authMessage = '¡Cuenta creada! Ya puedes iniciar sesión.';
          this.messageType = 'success';
          setTimeout(() => this.switchView('login'), 2000);
        } else {
          this.authMessage = response.message || 'Error al registrarse';
          this.messageType = 'error';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.authMessage = err.error?.message || 'Error en el servidor';
        this.messageType = 'error';
      }
    });
  }
}
