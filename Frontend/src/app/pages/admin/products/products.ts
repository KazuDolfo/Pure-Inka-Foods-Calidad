import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { ProductService } from '../../../../services/product.service';
import { Categoria, Producto } from '../../../../models';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrls: ['./products.scss']
})
export class ProductsComponent implements OnInit {
  categoryForm: FormGroup;
  productForm: FormGroup;
  editProductForm: FormGroup;

  selectedFile: File | null = null;
  selectedEditFile: File | null = null;
  selectedProduct = signal<Producto | null>(null);

  showAddProductModal = signal(false);
  showAddCategoryModal = signal(false);
  editingStock: number | null = null;

  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    public adminService: AdminService,
    public productService: ProductService
  ) {
    this.categoryForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['']
    });

    this.productForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      id_categoria: ['', Validators.required],
      precio_unitario: ['', [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]]
    });

    this.editProductForm = this.fb.group({
      id: [''],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      id_categoria: ['', Validators.required],
      precio_unitario: ['', [Validators.required, Validators.min(0)]]
    });
  }

  async ngOnInit() {
    await this.productService.loadCategories();
    await this.productService.loadProducts();
  }

  onFileSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      this.selectedFile = fileList[0];
    }
  }

  onAddCategory() {
    if (this.categoryForm.valid) {
      this.adminService.addCategory(this.categoryForm.value).subscribe({
        next: () => {
          this.successMessage.set('Categoría añadida exitosamente.');
          this.errorMessage.set(null);
          this.categoryForm.reset();
          this.productService.loadCategories();
          this.showAddCategoryModal.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Ocurrió un error');
          this.successMessage.set(null);
        }
      });
    }
  }

  onAddProduct() {
    if (this.productForm.valid) {
      const formData = new FormData();
      Object.keys(this.productForm.value).forEach(key => {
        formData.append(key, this.productForm.value[key]);
      });
      if (this.selectedFile) {
        formData.append('imagen', this.selectedFile, this.selectedFile.name);
      }

      this.adminService.addProduct(formData).subscribe({
        next: () => {
          this.successMessage.set('Producto añadido exitosamente.');
          this.errorMessage.set(null);
          this.productForm.reset();
          this.selectedFile = null;
          this.productService.loadProducts();
          this.showAddProductModal.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Ocurrió un error');
          this.successMessage.set(null);
        }
      });
    }
  }

  onEditProduct(product: Producto) {
    this.selectedProduct.set(product);
    this.selectedEditFile = null;
    this.editProductForm.patchValue({
      id: product.idProducto || (product as any).id,
      nombre: product.nombre || (product as any).name,
      descripcion: product.descripcion || (product as any).description,
      id_categoria: product.idCategoria || (product as any).id_categoria,
      precio_unitario: product.precio || (product as any).price
    });
  }

  onEditFileSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      this.selectedEditFile = fileList[0];
    }
  }

  onUpdateProduct() {
    if (this.editProductForm.valid) {
      const id = this.editProductForm.value.id;
      const formData = new FormData();

      formData.append('nombre', this.editProductForm.value.nombre);
      formData.append('descripcion', this.editProductForm.value.descripcion);
      formData.append('id_categoria', this.editProductForm.value.id_categoria);
      formData.append('precio_unitario', this.editProductForm.value.precio_unitario);

      if (this.selectedEditFile) {
        formData.append('imagen', this.selectedEditFile, this.selectedEditFile.name);
      }

      this.adminService.updateProduct(id, formData).subscribe({
        next: () => {
          this.successMessage.set('Producto actualizado exitosamente.');
          this.errorMessage.set(null);
          this.selectedProduct.set(null);
          this.selectedEditFile = null;
          this.productService.loadProducts();
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Ocurrió un error');
          this.successMessage.set(null);
        }
      });
    }
  }

  onUpdateStock(product: Producto, event: any) {
    const id = product.idProducto || (product as any).id;
    const newStock = event.target.value;
    this.adminService.updateStock(id, newStock).subscribe({
      next: () => {
        this.successMessage.set('Stock actualizado exitosamente.');
        this.errorMessage.set(null);
        this.productService.loadProducts();
        this.editingStock = null;
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Ocurrió un error');
        this.successMessage.set(null);
      }
    });
  }

  onDeleteProduct(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.adminService.deleteProduct(id).subscribe({
        next: () => {
          this.successMessage.set('Producto eliminado exitosamente.');
          this.errorMessage.set(null);
          this.productService.loadProducts();
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Ocurrió un error');
          this.successMessage.set(null);
        }
      });
    }
  }
}
