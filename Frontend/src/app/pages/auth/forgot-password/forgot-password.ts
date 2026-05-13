import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPasswordComponent {
  step: 'phone' | 'reset' = 'phone';
  telefono: string = '';
  codigo: string = '';
  nuevaContrasena: string = '';
  confirmarContrasena: string = '';
  
  loading: boolean = false;
  message: string | null = null;
  error: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  requestLink() {
    if (!this.telefono) {
      this.error = 'Por favor ingresa tu número de teléfono.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.message = null;

    this.authService.forgotPassword(this.telefono).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.step = 'reset';
          this.message = res.message;
        } else {
          this.error = res.message;
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Error al procesar la solicitud.';
        this.loading = false;
      }
    });
  }

  resetPassword() {
    if (!this.codigo || !this.nuevaContrasena || !this.confirmarContrasena) {
      this.error = 'Todos los campos son requeridos.';
      return;
    }

    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.error = null;

    this.authService.resetPassword({
      telefono: this.telefono,
      codigo: this.codigo,
      nuevaContrasena: this.nuevaContrasena
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message = 'Contraseña restablecida con éxito. Redirigiendo al login...';
          setTimeout(() => this.router.navigate(['/auth/login']), 3000);
        } else {
          this.error = res.message;
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Error al restablecer la contraseña.';
        this.loading = false;
      }
    });
  }
}