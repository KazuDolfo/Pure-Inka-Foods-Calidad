import { Component, signal, OnInit, computed, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { CartService } from '../../../services/cart.service';
import { CartItem } from '../../../models';
import { Direccion, TipoDireccion } from '../../../models/direccion.model';
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
        private router = inject(Router);
        private cartService = inject(CartService);
        private http = inject(HttpClient);
        private authService = inject(AuthService);
        private paymentMethodService = inject(PaymentMethodService);

        currentStep = signal<number>(1);
        cartItems = signal<CartItem[]>([]);
        
        
        allShippingOptions = signal<any[]>([]);

        isPeru = computed(() => {
                const addrId = this.selectedAddressId();
                if (!addrId) return true;
                const addr = this.direcciones().find(d => d.id_direccion === addrId);
                if (!addr) return true;
                const pais = addr.pais?.toLowerCase() || '';
                return pais === 'perú' || pais === 'peru';
        });

        filteredShippingOptions = computed(() => {
                
                
                return this.allShippingOptions();
        });

        
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
        cardHolderName = signal('');
        isProcessing = signal(false);
        orderPlaced = signal(false);

        
        paymentMethods = signal<PaymentMethod[]>([]);
        selectedFile = signal<File | null>(null);

        subtotal = computed(() =>
                this.cartItems().reduce((acc, item) => acc + item.price * item.quantity, 0)
        );

        total = computed(() => this.subtotal() + this.selectedShipping());

        private ORDERS_API = `${environment.apiUrl}/orders`;
        private USERS_API = `${environment.apiUrl}/users`;
        private PAYMENT_API = `${environment.apiUrl}/payment`;
        private SHIPPING_API = `${environment.apiUrl}/shipping`;

        
        stripe: Stripe | null = null;
        elements: StripeElements | null = null;
        card: StripeCardElement | null = null;
        stripeError = signal<string | null>(null);

        async ngOnInit(): Promise<void> {
                this.cartItems.set(this.cartService.getCartItems());
                this.loadAddresses();
                this.loadPaymentMethods();
                this.loadShippingOptions();

                
                console.log('💳 Iniciando carga de Stripe...');
                try {
                    this.stripe = await loadStripe(environment.stripePublicKey);
                    if (this.stripe) {
                        console.log('✅ Stripe cargado correctamente.');
                    } else {
                        console.error('❌ Error: loadStripe devolvió null.');
                    }
                } catch (err) {
                    console.error('❌ Error crítico al cargar Stripe:', err);
                }
        }

        async loadShippingOptions(): Promise<void> {
            try {
                const res: any = await firstValueFrom(this.http.get(this.SHIPPING_API));
                if (res.success) {
                    this.allShippingOptions.set(res.data);
                }
            } catch (err) {
                console.error('Error loading shipping options:', err);
            }
        }

        
        nextStepShipping(): void {
            if (this.selectedShipping() !== -1) {
                this.nextStep();
            } else {
                this.checkoutError.set('Por favor, selecciona un método de envío antes de continuar.');
            }
        }

        loadPaymentMethods() {
                this.paymentMethodService.getActiveMethods().subscribe({
                        next: (methods: any) => {
                                this.paymentMethods.set(methods);
                                
                                if (methods.length > 0) {
                                        this.paymentMethod.set(methods[0].nombre);
                                }
                        },
                        error: (err: any) => console.error('Error loading payment methods', err)
                });
        }

        
        isCardMethod(methodName: string): boolean {
                const name = methodName.toLowerCase();
                return name === 'card' || name === 'tarjeta';
        }

        nextStep(): void {
                if (this.currentStep() < 3) {
                        this.currentStep.update(step => step + 1);

                        if (this.currentStep() === 3 && this.isCardMethod(this.paymentMethod())) {
                                setTimeout(() => this.mountStripeElement(), 100);
                        }
                }
        }

        prevStep(): void {
                if (this.currentStep() > 1) {
                        this.currentStep.update(step => step - 1);
                }
        }

        
        nextStepAddress(): void {
                this.checkoutError.set(null);
                if (this.selectedAddressId()) {
                        this.nextStep();
                } else {
                        this.checkoutError.set('Debe seleccionar una dirección de envío registrada.');
                }
        }
        


        private getAuthHeaders() {
                const token = this.authService.getToken();
                const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
                return token ? { headers: headers.set('Authorization', `Bearer ${token}`) } : { headers };
        }

        private getAuthHeadersMultipart() {
                const token = this.authService.getToken();
                
                return token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
        }

        
        
        

        async loadAddresses(): Promise<void> {
                this.isLoading.set(true);
                this.checkoutError.set(null);
                try {
                        const url = `${this.USERS_API}/addresses`;
                        const res: any = await firstValueFrom(this.http.get(url, this.getAuthHeaders()));

                        const addresses: Direccion[] = res.data || res;
                        this.direcciones.set(addresses);

                        const defaultAddress = addresses.find(d => d.tipo === 'envio') || addresses[0];
                        if (defaultAddress) {
                                this.selectAddress(defaultAddress.id_direccion);
                        }

                } catch (err: any) {
                        console.error('Error al cargar direcciones:', err);
                        const message = err.error?.message || 'Error al cargar direcciones. Verifique su sesión.';
                        this.checkoutError.set(message);
                } finally {
                        this.isLoading.set(false);
                }
        }

        async addAddress(form: NgForm): Promise<void> {
                if (form.invalid) return;

                this.isProcessing.set(true);
                this.checkoutError.set(null);

                try {
                        const url = `${this.USERS_API}/addresses`;
                        const res: any = await firstValueFrom(this.http.post(url, this.addressForm, this.getAuthHeaders()));

                        
                        const newAddress: Direccion = res.data || res.address || res;
                        const anyAddress = newAddress as any;

                        if (!newAddress || (!newAddress.id_direccion && !anyAddress.id)) {
                             throw new Error('La respuesta del servidor no contiene una dirección válida.');
                        }

                        
                        if (!newAddress.id_direccion && anyAddress.id) {
                            newAddress.id_direccion = anyAddress.id;
                        }

                        this.direcciones.update(list => [...list, newAddress]);
                        this.selectAddress(newAddress.id_direccion);

                        this.showAddressForm.set(false);
                        form.resetForm({ 
                                direccion: '', ciudad: '', distrito: '', referencia: '', pais: 'Perú', codigo_postal: '',
                                nombre_receptor: '', telefono_receptor: '', tipo: 'envio'
                        });

                        this.nextStep(); 
                } catch (err: any) {
                        console.error('Error al guardar dirección:', err);
                        this.checkoutError.set(err.error?.message || 'Error al guardar la nueva dirección.');
                } finally {
                        this.isProcessing.set(false);
                }
        }

        selectAddress(id: number): void {
                this.selectedAddressId.set(id);
                const address = this.direcciones().find(d => d.id_direccion === id);

                if (address) {
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
        }

        
        
        
        mountStripeElement() {
                if (!this.stripe) return;

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
                        if (event.error) {
                                this.stripeError.set(event.error.message);
                        } else {
                                this.stripeError.set(null);
                        }
                });
        }

        async handleStripePayment(): Promise<boolean> {
                if (!this.stripe || !this.card) return false;

                try {
                        
                        const paymentIntentUrl = `${this.PAYMENT_API}/create-payment-intent`;
                        const intentRes: any = await firstValueFrom(this.http.post(paymentIntentUrl, {
                                amount: this.total()
                        }, this.getAuthHeaders()));

                        const clientSecret = intentRes.clientSecret;

                        
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
                        } else {
                                if (result.paymentIntent.status === 'succeeded') {
                                        return true;
                                }
                        }
                } catch (error: any) {
                        console.error('Error en pago Stripe:', error);
                        this.stripeError.set(error.error?.message || 'Error de comunicación con el servidor de pagos.');
                        return false;
                }
                return false;
        }

        onFileSelected(event: any) {
                const file = event.target.files[0];
                if (file) {
                        this.selectedFile.set(file);
                }
        }

        getSelectedPaymentMethod() {
                return this.paymentMethods().find((m: any) => m.nombre === this.paymentMethod());
        }

        
        
        
        async placeOrder(): Promise<void> {
                this.isProcessing.set(true);
                this.checkoutError.set(null);
                this.stripeError.set(null);

                const id_direccion_envio = this.selectedAddressId();
                if (!id_direccion_envio) {
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

                const currentMethod = this.getSelectedPaymentMethod();
                const needsFile = currentMethod && currentMethod.nombre.toLowerCase() !== 'paypal' && !this.isCardMethod(currentMethod.nombre);

                if (needsFile) {
                        if (!this.selectedFile()) {
                                this.checkoutError.set('Por favor, suba el comprobante de pago.');
                                this.isProcessing.set(false);
                                return;
                        }
                }

                const formData = new FormData();
                formData.append('id_direccion_envio', id_direccion_envio.toString());
                formData.append('id_tipo_entrega', this.selectedShippingId().toString());
                formData.append('metodo_pago', this.paymentMethod());
                formData.append('items', JSON.stringify(this.cartItems()));
                formData.append('subtotal', this.subtotal().toString());
                formData.append('costo_envio', this.selectedShipping().toString());
                formData.append('total', this.total().toString());

                if (this.selectedFile()) {
                        formData.append('comprobante_pago', this.selectedFile()!);
                }

                try {
                        await new Promise(res => setTimeout(res, 1200));

                        const res: any = await firstValueFrom(this.http.post(this.ORDERS_API, formData, this.getAuthHeadersMultipart()));

                        console.log('Order created response:', res);
                        this.isProcessing.set(false);
                        this.orderPlaced.set(true);
                        await this.cartService.clearCart();

                        setTimeout(() => {
                                this.router.navigate(['/']);
                                this.orderPlaced.set(false);
                        }, 3500);

                } catch (err: any) {
                        console.error('Error creating order:', err);
                        this.isProcessing.set(false);

                        const errorMessage = err.error?.message || 'Error desconocido al procesar el pedido. Verifique el carrito.';
                        this.checkoutError.set(errorMessage);
                }
        }

        onShippingChange(event: any, opt: any): void {
                const cost = parseFloat(event.target.value);
                this.selectedShipping.set(cost);
                this.selectedShippingId.set(opt.id || opt.idTipoEntrega);
        }

        onPaymentMethodChange(method: string) {
                this.paymentMethod.set(method as any);
                if (this.isCardMethod(method) && this.currentStep() === 3) {
                        setTimeout(() => this.mountStripeElement(), 100);
                }
        }
}
