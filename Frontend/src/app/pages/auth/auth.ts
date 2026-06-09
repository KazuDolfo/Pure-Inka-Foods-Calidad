import { Component, signal, inject, AfterViewInit } from '@angular/core';
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
export class Auth implements AfterViewInit {
  currentView = signal<'login' | 'register' | 'verify'>('login');
  showAdminModal = signal(false);

  loginData: LoginForm = { email: '', password: '' };
  registerData: RegisterForm = { name: '', email: '', phone: '', password: '', confirmPassword: '' };
  adminLoginData = { email: '', password: '' };
  verifyData = { email: '', code: '' };

  isSubmitting = false;
  authMessage: string | null = null;
  messageType: 'success' | 'error' | null = null;

  isSubmittingAdmin = false;
  adminAuthMessage: string | null = null;
  adminMessageType: 'success' | 'error' | null = null;

  private readonly API_URL = 'http://localhost:5000/api/auth';
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  switchView(view: 'login' | 'register' | 'verify'): void {
    this.currentView.set(view);
    this.resetMessages();
  }

  openAdminModal(): void {
    this.showAdminModal.set(true);
    this.resetAdminMessages();
  }

  closeAdminModal(): void {
    this.showAdminModal.set(false);
  }

  signInAdmin(): void {
    if (!this.adminLoginData.email || !this.adminLoginData.password) {
      this.setAdminMessage('Por favor, completa todos los campos.', 'error');
      return;
    }

    this.isSubmittingAdmin = true;
    this.resetAdminMessages();

    const credentials = this.buildCredentials(this.adminLoginData.email, this.adminLoginData.password);

    this.http.post<ApiLoginResponse>(`${this.API_URL}/login`, credentials).subscribe({
      next: (response) => {
        this.isSubmittingAdmin = false;

        if (!response.success || !response.data?.user) {
          this.setAdminMessage(response.message || 'Credenciales inválidas.', 'error');
          return;
        }

        const { user, token } = response.data;
        if (user.rol !== 'admin') {
          this.setAdminMessage('Acceso denegado. No eres administrador.', 'error');
          return;
        }

        this.authService['handleAuthResponse']({ token, user } as any);
        this.setAdminMessage('¡Acceso administrativo concedido!', 'success');
        setTimeout(() => {
          this.closeAdminModal();
          this.router.navigate(['/admin']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmittingAdmin = false;
        this.setAdminMessage(err.error?.message || 'Error de conexión', 'error');
      }
    });
  }

  signIn(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.setAuthMessage('Por favor, completa todos los campos.', 'error');
      return;
    }

    this.isSubmitting = true;
    this.resetAuthMessages();

    const credentials = this.buildCredentials(this.loginData.email, this.loginData.password);

    this.http.post<ApiLoginResponse>(`${this.API_URL}/login`, credentials).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (!response.success || !response.data?.user) {
          this.setAuthMessage(response.message || 'Credenciales inválidas.', 'error');
          return;
        }

        const { user, token } = response.data;
        if (user.rol === 'admin') {
          this.setAuthMessage('Por favor usa el acceso para administradores.', 'error');
          return;
        }

        this.authService['handleAuthResponse']({ token, user } as any);
        this.setAuthMessage('¡Bienvenido de nuevo!', 'success');
        setTimeout(() => this.router.navigate(['/']), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.processSignInError(err);
      }
    });
  }

  signUp(): void {
    const validationError = this.validateRegistrationForm();
    if (validationError) {
      this.setAuthMessage(validationError, 'error');
      return;
    }

    this.isSubmitting = true;
    this.resetAuthMessages();

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
          this.setAuthMessage('¡Cuenta creada! Ingrese el código enviado a su correo.', 'success');
          this.verifyData.email = userData.correo;
          setTimeout(() => this.switchView('verify'), 2000);
        } else {
          this.setAuthMessage(response.message || 'Error al registrarse', 'error');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.setAuthMessage(err.error?.message || 'Error en el servidor', 'error');
      }
    });
  }

  verifyAccount(): void {
    if (!this.verifyData.code) {
      this.setAuthMessage('Por favor, ingrese el código de 6 dígitos.', 'error');
      return;
    }

    this.isSubmitting = true;
    this.resetAuthMessages();

    this.http.post<any>(`${this.API_URL}/verify`, {
      correo: this.verifyData.email,
      codigo: this.verifyData.code
    }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.setAuthMessage('¡Cuenta activada con éxito! Ya puede iniciar sesión.', 'success');
          setTimeout(() => this.switchView('login'), 2000);
        } else {
          this.setAuthMessage(response.message || 'Código incorrecto.', 'error');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.setAuthMessage(err.error?.message || 'Error al verificar.', 'error');
      }
    });
  }

  private validateRegistrationForm(): string | null {
    if (!this.registerData.name || !this.registerData.email || !this.registerData.phone || !this.registerData.password) {
      return 'Por favor, completa todos los campos obligatorios.';
    }

    if (!this.isEmailValid(this.registerData.email)) {
      return 'Por favor, ingrese un correo electrónico válido.';
    }

    if (this.registerData.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }

    return null;
  }

  private isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private processSignInError(error: any): void {
    if (error.error?.requiresVerification) {
      this.setAuthMessage('Su cuenta aún no está activa. Ingrese el código de verificación.', 'error');
      this.verifyData.email = this.loginData.email;
      setTimeout(() => this.switchView('verify'), 2000);
      return;
    }

    this.setAuthMessage(error.error?.message || 'Error de conexión', 'error');
  }

  private buildCredentials(email: string, password: string) {
    return {
      correo: email.trim().toLowerCase(),
      contrasena: password
    };
  }

  private resetMessages(): void {
    this.resetAuthMessages();
    this.resetAdminMessages();
  }

  private resetAuthMessages(): void {
    this.authMessage = null;
    this.messageType = null;
  }

  private resetAdminMessages(): void {
    this.adminAuthMessage = null;
    this.adminMessageType = null;
  }

  private setAuthMessage(message: string, type: 'success' | 'error'): void {
    this.authMessage = message;
    this.messageType = type;
  }

  private setAdminMessage(message: string, type: 'success' | 'error'): void {
    this.adminAuthMessage = message;
    this.adminMessageType = type;
  }

  ngAfterViewInit(): void {
    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn(): void {
    if (typeof (window as any).google !== 'undefined') {
      (window as any).google.accounts.id.initialize({
        client_id: '439654943835-hkl8iq4dvo6f5qlm73q1v5va90b4pq9e.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleCredential(response.credential)
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById('googleBtn'),
        { theme: 'outline', size: 'large', width: '100%' }
      );
    } else {
      setTimeout(() => this.initializeGoogleSignIn(), 1000);
    }
  }

  handleGoogleCredential(credential: string): void {
    this.isSubmitting = true;
    this.resetAuthMessages();

    this.http.post<ApiLoginResponse>(`${this.API_URL}/google-login`, { token: credential }).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (!response.success || !response.data?.user) {
          this.setAuthMessage(response.message || 'Error de autenticación con Google.', 'error');
          return;
        }

        const { user, token } = response.data;
        if (user.rol === 'admin') {
          this.setAuthMessage('Por favor usa el acceso para administradores.', 'error');
          return;
        }

        this.authService['handleAuthResponse']({ token, user } as any);
        this.setAuthMessage('¡Bienvenido con Google!', 'success');
        setTimeout(() => this.router.navigate(['/']), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.setAuthMessage(err.error?.message || 'Error al conectar con Google.', 'error');
      }
    });
  }
}
