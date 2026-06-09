import { Component, signal, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { CartService } from '../../../services/cart.service';
import { CartItem } from '../../../models';
import { Direccion } from '../../../models/direccion.model';
import { Usuario } from '../../../models/usuario.model';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { PaymentMethodService, PaymentMethod } from '../../../services/payment-method.service';

interface ShippingData {
  fullName: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
  phone: string;
}

interface NewAddressForm {
  direccion: string;
  distrito: string;
  referencia: string;
  ciudad: string;
  pais: string;
  codigo_postal: string;
  nombre_receptor: string;
  telefono_receptor: string;
  tipo: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly paymentMethodService = inject(PaymentMethodService);

  currentStep = signal<number>(1);
  cartItems = signal<CartItem[]>([]);
  allShippingOptions = signal<any[]>([]);

  isPeru = computed(() => {
    const selectedId = this.selectedAddressId();
    if (!selectedId) {
      return true;
    }

    const selectedAddress = this.getAddressById(selectedId);
    if (!selectedAddress) {
      return true;
    }

    const country = selectedAddress.pais?.toLowerCase() || '';
    return country === 'perú' || country === 'peru';
  });

  filteredShippingOptions = computed(() => this.allShippingOptions());

  direcciones = signal<Direccion[]>([]);
  selectedAddressId = signal<number | null>(null);
  showAddressForm = signal(false);
  addressForm: NewAddressForm = {
    direccion: '',
    distrito: '',
    referencia: '',
    ciudad: '',
    pais: 'Perú',
    codigo_postal: '',
    nombre_receptor: '',
    telefono_receptor: '',
    tipo: 'envio'
  };
  isLoading = signal(false);
  checkoutError = signal<string | null>(null);

  shippingData: ShippingData = {
    fullName: '',
    address: '',
    city: '',
    country: 'Perú',
    zipCode: '',
    phone: ''
  };

  selectedShipping = signal<number>(-1);
  selectedShippingId = signal<number>(-1);
  paymentMethod = signal<'card' | 'paypal' | 'yape' | 'plin' | 'transferencia'>('card');

  tipoComprobante = signal<'BOLETA' | 'FACTURA'>('BOLETA');
  ruc = signal('');
  razonSocial = signal('');
  showFacturaModal = signal(false);

  cardHolderName = signal('');
  isProcessing = signal(false);
  orderPlaced = signal(false);

  paymentMethods = signal<PaymentMethod[]>([]);
  selectedFile = signal<File | null>(null);

  couponCode = signal('');
  appliedCoupon = signal<any>(null);
  couponDiscount = signal<number>(0);
  couponError = signal<string | null>(null);
  isApplyingCoupon = signal(false);

  subtotal = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.price * item.quantity, 0)
  );

  total = computed(() => {
    const shippingCost = this.selectedShipping();
    const baseTotal = this.subtotal() + (shippingCost === -1 ? 0 : shippingCost);
    return Math.max(0, baseTotal - this.couponDiscount());
  });

  private readonly ORDERS_API = `${environment.apiUrl}/orders`;
  private readonly USERS_API = `${environment.apiUrl}/users`;
  private readonly PAYMENT_API = `${environment.apiUrl}/payment`;
  private readonly SHIPPING_API = `${environment.apiUrl}/shipping`;

  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  card: StripeCardElement | null = null;
  stripeError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.cartItems.set(this.cartService.getCartItems());
    this.initializeCheckout();
  }

  private initializeCheckout(): void {
    this.loadAddresses();
    this.loadPaymentMethods();
    this.loadShippingOptions();
    this.initializeStripeClient();
  }

  async loadShippingOptions(): Promise<void> {
    try {
      const response: any = await firstValueFrom(this.http.get(this.SHIPPING_API));
      if (response.success) {
        this.allShippingOptions.set(response.data);
      }
    } catch (error) {
      console.error('Error loading shipping options:', error);
    }
  }

  nextStepShipping(): void {
    if (this.selectedShipping() !== -1) {
      this.nextStep();
      return;
    }

    this.checkoutError.set('Por favor, selecciona un método de envío antes de continuar.');
  }

  private loadPaymentMethods(): void {
    this.paymentMethodService.getActiveMethods().subscribe({
      next: (methods: any) => {
        this.paymentMethods.set(methods);
        if (methods.length > 0) {
          this.paymentMethod.set(methods[0].nombre);
        }
      },
      error: (error: any) => console.error('Error loading payment methods', error)
    });
  }

  isCardMethod(methodName: string): boolean {
    const normalizedName = methodName.toLowerCase();
    return normalizedName === 'card' || normalizedName === 'tarjeta';
  }

  nextStep(): void {
    if (this.currentStep() >= 3) {
      return;
    }

    this.currentStep.update((step) => step + 1);
    if (this.currentStep() === 3 && this.isCardMethod(this.paymentMethod())) {
      setTimeout(() => this.mountStripeElement(), 100);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => step - 1);
    }
  }

  nextStepAddress(): void {
    this.checkoutError.set(null);
    if (this.selectedAddressId()) {
      this.nextStep();
      return;
    }

    this.checkoutError.set('Debe seleccionar una dirección de envío registrada.');
  }

  private getAuthHeaders(contentType = 'application/json') {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({ 'Content-Type': contentType });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  private getAuthHeadersMultipart() {
    const token = this.authService.getToken();
    return token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
  }

  private async initializeStripeClient(): Promise<void> {
    try {
      this.stripe = await loadStripe(environment.stripePublicKey);
      if (!this.stripe) {
        console.error('Error: loadStripe devolvió null.');
      }
    } catch (error) {
      console.error('Error crítico al cargar Stripe:', error);
    }
  }

  async loadAddresses(): Promise<void> {
    this.isLoading.set(true);
    this.checkoutError.set(null);

    try {
      const url = `${this.USERS_API}/addresses`;
      const response: any = await firstValueFrom(this.http.get(url, this.getAuthHeaders()));
      const addresses: Direccion[] = response.data || response;
      this.direcciones.set(addresses);

      const defaultAddress = addresses.find((address) => address.tipo === 'envio') || addresses[0];
      if (defaultAddress) {
        this.selectAddress(defaultAddress.id_direccion);
      }
    } catch (error: any) {
      console.error('Error al cargar direcciones:', error);
      this.checkoutError.set(error.error?.message || 'Error al cargar direcciones. Verifique su sesión.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async addAddress(form: NgForm): Promise<void> {
    if (form.invalid) {
      return;
    }

    this.isProcessing.set(true);
    this.checkoutError.set(null);

    try {
      const url = `${this.USERS_API}/addresses`;
      const response: any = await firstValueFrom(this.http.post(url, this.addressForm, this.getAuthHeaders()));
      const newAddress: Direccion = response.data || response.address || response;
      const anyAddress = newAddress as any;

      if (!newAddress || (!newAddress.id_direccion && !anyAddress.id)) {
        throw new Error('La respuesta del servidor no contiene una dirección válida.');
      }

      if (!newAddress.id_direccion && anyAddress.id) {
        newAddress.id_direccion = anyAddress.id;
      }

      this.direcciones.update((list) => [...list, newAddress]);
      this.selectAddress(newAddress.id_direccion);
      this.showAddressForm.set(false);
      this.resetAddressForm(form);
      this.nextStep();
    } catch (error: any) {
      console.error('Error al guardar dirección:', error);
      this.checkoutError.set(error.error?.message || 'Error al guardar la nueva dirección.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private resetAddressForm(form: NgForm): void {
    form.resetForm({
      direccion: '',
      ciudad: '',
      distrito: '',
      referencia: '',
      pais: 'Perú',
      codigo_postal: '',
      nombre_receptor: '',
      telefono_receptor: '',
      tipo: 'envio'
    });
  }

  selectAddress(id: number): void {
    this.selectedAddressId.set(id);
    const address = this.getAddressById(id);
    if (!address) {
      return;
    }

    const currentUser = this.authService.getCurrentUser() as Usuario | null;
    this.shippingData = {
      fullName: address.nombre_receptor || currentUser?.nombre || 'Cliente',
      address: address.direccion,
      city: address.ciudad,
      country: address.pais,
      zipCode: address.codigo_postal || '',
      phone: address.telefono_receptor || currentUser?.telefono || 'N/A'
    };
  }

  private getAddressById(id: number): Direccion | undefined {
    return this.direcciones().find((address) => address.id_direccion === id);
  }

  mountStripeElement(): void {
    if (!this.stripe) {
      return;
    }

    this.elements = this.stripe.elements();
    this.card = this.elements.create('card', {
      style: {
        base: {
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });

    this.card.mount('#card-element');
    this.card.on('change', (event: any) => {
      this.stripeError.set(event.error ? event.error.message : null);
    });
  }

  private async handleStripePayment(): Promise<boolean> {
    if (!this.stripe || !this.card) {
      return false;
    }

    try {
      const paymentIntentUrl = `${this.PAYMENT_API}/create-payment-intent`;
      const intentResponse: any = await firstValueFrom(
        this.http.post(paymentIntentUrl, { amount: this.total() }, this.getAuthHeaders())
      );
      const clientSecret = intentResponse.clientSecret;

      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.card,
          billing_details: {
            name: this.shippingData.fullName,
            email: this.authService.getCurrentUser()?.email
          }
        }
      });

      if (result.error) {
        this.stripeError.set(result.error.message || 'Error al procesar el pago.');
        return false;
      }

      return result.paymentIntent?.status === 'succeeded';
    } catch (error: any) {
      console.error('Error en pago Stripe:', error);
      this.stripeError.set(error.error?.message || 'Error de comunicación con el servidor de pagos.');
      return false;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  getSelectedPaymentMethod(): PaymentMethod | undefined {
    return this.paymentMethods().find((method) => method.nombre === this.paymentMethod());
  }

  private requiresPaymentProof(): boolean {
    const currentMethod = this.getSelectedPaymentMethod();
    return !!currentMethod && currentMethod.nombre.toLowerCase() !== 'paypal' && !this.isCardMethod(currentMethod.nombre);
  }

  async placeOrder(): Promise<void> {
    if (this.tipoComprobante() === 'FACTURA' && (!this.ruc() || !this.razonSocial())) {
      this.checkoutError.set('Por favor, complete los datos de la factura.');
      this.showFacturaModal.set(true);
      return;
    }

    this.isProcessing.set(true);
    this.checkoutError.set(null);
    this.stripeError.set(null);

    const shippingAddressId = this.selectedAddressId();
    if (!shippingAddressId) {
      this.checkoutError.set('Error de sistema: No se detectó dirección de envío.');
      this.isProcessing.set(false);
      return;
    }

    if (this.isCardMethod(this.paymentMethod())) {
      const paymentSuccess = await this.handleStripePayment();
      if (!paymentSuccess) {
        this.isProcessing.set(false);
        return;
      }
    }

    if (this.requiresPaymentProof() && !this.selectedFile()) {
      this.checkoutError.set('Por favor, suba el comprobante de pago.');
      this.isProcessing.set(false);
      return;
    }

    const orderFormData = this.buildOrderFormData(shippingAddressId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const response: any = await firstValueFrom(
        this.http.post(this.ORDERS_API, orderFormData, this.getAuthHeadersMultipart())
      );

      console.log('Order created response:', response);
      this.isProcessing.set(false);
      this.orderPlaced.set(true);
      await this.cartService.clearCart();

      setTimeout(() => {
        this.router.navigate(['/user-profile']);
        this.orderPlaced.set(false);
      }, 3500);
    } catch (error: any) {
      console.error('Error creating order:', error);
      this.isProcessing.set(false);
      this.checkoutError.set(error.error?.message || 'Error desconocido al procesar el pedido. Verifique el carrito.');
    }
  }

  private buildOrderFormData(shippingAddressId: number): FormData {
    const formData = new FormData();
    formData.append('id_direccion_envio', shippingAddressId.toString());
    formData.append('id_tipo_entrega', this.selectedShippingId().toString());
    formData.append('metodo_pago', this.paymentMethod());
    formData.append('items', JSON.stringify(this.cartItems()));
    formData.append('subtotal', this.subtotal().toString());
    formData.append('costo_envio', this.selectedShipping().toString());
    formData.append('total', this.total().toString());
    formData.append('tipo_comprobante', this.tipoComprobante());

    if (this.tipoComprobante() === 'FACTURA') {
      formData.append('ruc', this.ruc());
      formData.append('razon_social', this.razonSocial());
    }

    if (this.selectedFile()) {
      formData.append('comprobante_pago', this.selectedFile()!);
    }

    if (this.appliedCoupon()) {
      formData.append('id_cupon', this.appliedCoupon().idCupon.toString());
      formData.append('descuento', this.couponDiscount().toString());
    }

    return formData;
  }

  onShippingChange(event: any, opt: any): void {
    const cost = this.parseShippingCost(event.target.value);
    this.selectedShipping.set(cost);
    this.selectedShippingId.set(opt.id || opt.idTipoEntrega);
  }

  private parseShippingCost(value: any): number {
    const cost = Number(value);
    return Number.isFinite(cost) ? cost : 0;
  }

  onPaymentMethodChange(method: string): void {
    this.paymentMethod.set(method as any);
    if (this.isCardMethod(method) && this.currentStep() === 3) {
      setTimeout(() => this.mountStripeElement(), 100);
    }
  }

  onComprobanteChange(tipo: 'BOLETA' | 'FACTURA'): void {
    this.tipoComprobante.set(tipo);
    if (tipo === 'FACTURA') {
      this.showFacturaModal.set(true);
    }
  }

  closeFacturaModal(): void {
    this.showFacturaModal.set(false);
  }

  saveFacturaData(): void {
    if (this.ruc().length !== 11) {
      alert('El RUC debe tener 11 dígitos.');
      return;
    }

    if (!this.razonSocial()) {
      alert('Debe ingresar la Razón Social.');
      return;
    }

    this.showFacturaModal.set(false);
  }

  onRucInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.ruc.set(input.value);
  }

  onRazonSocialInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.razonSocial.set(input.value);
  }

  async applyCoupon(): Promise<void> {
    const code = this.couponCode().trim();
    if (!code) {
      this.couponError.set('Ingrese un código de cupón.');
      return;
    }

    this.isApplyingCoupon.set(true);
    this.couponError.set(null);

    try {
      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/coupons/validate`, { codigo: code }, this.getAuthHeaders())
      );

      if (response.success && response.data) {
        const coupon = response.data;
        this.appliedCoupon.set(coupon);
        
        let discount = 0;
        if (coupon.tipo === 'porcentaje') {
          discount = this.subtotal() * (coupon.valor / 100);
        } else if (coupon.tipo === 'fijo') {
          discount = coupon.valor;
        }

        this.couponDiscount.set(Math.min(discount, this.subtotal()));
        this.couponError.set(null);
      } else {
        this.couponError.set(response.message || 'Cupón inválido.');
        this.appliedCoupon.set(null);
        this.couponDiscount.set(0);
      }
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      this.couponError.set(error.error?.message || 'Cupón inválido o expirado.');
      this.appliedCoupon.set(null);
      this.couponDiscount.set(0);
    } finally {
      this.isApplyingCoupon.set(false);
    }
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.couponDiscount.set(0);
    this.couponCode.set('');
    this.couponError.set(null);
  }
}
