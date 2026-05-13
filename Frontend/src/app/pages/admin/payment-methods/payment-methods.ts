import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentMethodService, PaymentMethod } from '../../../../services/payment-method.service';

@Component({
    selector: 'app-payment-methods',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './payment-methods.html',
    styles: [`
    .qr-preview {
      max-width: 150px;
      max-height: 150px;
      object-fit: contain;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    .method-card {
      transition: all 0.3s ease;
    }
    .method-card:hover {
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
  `]
})
export class PaymentMethodsComponent implements OnInit {
    methods = signal<PaymentMethod[]>([]);
    isLoading = signal(false);
    error = signal<string | null>(null);
    successMessage = signal<string | null>(null);

    
    showAddForm = signal(false);
    newMethod: any = {
        nombre: '',
        descripcion: '',
        instrucciones: '',
        activo: true
    };
    selectedFile: File | null = null;

    constructor(private paymentMethodService: PaymentMethodService) { }

    ngOnInit() {
        this.loadMethods();
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
        }
    }

    loadMethods() {
        this.isLoading.set(true);
        this.paymentMethodService.getAllMethods().subscribe({
            next: (data) => {
                this.methods.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading methods', err);
                this.error.set('Error al cargar métodos de pago.');
                this.isLoading.set(false);
            }
        });
    }

    addMethod() {
        if (!this.newMethod.nombre) return;
        
        const formData = new FormData();
        formData.append('nombre', this.newMethod.nombre);
        formData.append('descripcion', this.newMethod.descripcion);
        formData.append('instrucciones', this.newMethod.instrucciones);
        formData.append('activo', this.newMethod.activo ? '1' : '0');
        if (this.selectedFile) {
            formData.append('imagen_qr', this.selectedFile);
        }

        this.isLoading.set(true);
        this.paymentMethodService.createMethod(formData).subscribe({
            next: () => {
                this.successMessage.set('Nuevo método de pago agregado.');
                this.loadMethods();
                this.showAddForm.set(false);
                this.newMethod = { nombre: '', descripcion: '', instrucciones: '', activo: true };
                this.selectedFile = null;
                setTimeout(() => this.successMessage.set(null), 3000);
            },
            error: (err) => {
                this.error.set('No se pudo agregar el método.');
                this.isLoading.set(false);
            }
        });
    }

    deleteMethod(id: number) {
        if (!confirm('¿Estás seguro de eliminar este método?')) return;

        this.isLoading.set(true);
        this.paymentMethodService.deleteMethod(id).subscribe({
            next: () => {
                this.successMessage.set('Método de pago eliminado.');
                this.loadMethods();
                setTimeout(() => this.successMessage.set(null), 3000);
            },
            error: () => {
                this.error.set('No se pudo eliminar el método.');
                this.isLoading.set(false);
            }
        });
    }

    toggleActive(method: PaymentMethod) {
        const formData = new FormData();
        formData.append('nombre', method.nombre);
        formData.append('descripcion', method.descripcion || '');
        formData.append('instrucciones', method.instrucciones || '');
        formData.append('activo', method.activo ? '0' : '1');

        this.isLoading.set(true);
        this.paymentMethodService.updateMethod(method.id_metodo, formData).subscribe({
            next: () => {
                this.loadMethods();
            },
            error: () => {
                this.error.set('Error al cambiar estado.');
                this.isLoading.set(false);
            }
        });
    }

    updateMethod(method: PaymentMethod, fileInput?: HTMLInputElement) {
        this.isLoading.set(true);
        this.error.set(null);

        const formData = new FormData();
        formData.append('nombre', method.nombre);
        formData.append('descripcion', method.descripcion || '');
        formData.append('instrucciones', method.instrucciones || '');
        formData.append('activo', method.activo ? '1' : '0');
        
        if (fileInput && fileInput.files && fileInput.files[0]) {
            formData.append('imagen_qr', fileInput.files[0]);
        }

        this.paymentMethodService.updateMethod(method.id_metodo, formData).subscribe({
            next: () => {
                this.successMessage.set(`Método actualizado.`);
                this.loadMethods();
                setTimeout(() => this.successMessage.set(null), 3000);
            },
            error: (err) => {
                console.error('Error updating method', err);
                this.error.set('Error al actualizar el método.');
                this.isLoading.set(false);
            }
        });
    }

    getQrUrl(imageName?: string): string {
        if (!imageName) return '';
        return `http://localhost:5000/uploads/products/${imageName}`;
    }
}
