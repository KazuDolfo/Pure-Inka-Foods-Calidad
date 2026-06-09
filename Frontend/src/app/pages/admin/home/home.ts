import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AdminService } from '../../../../services/admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class AdminHomeComponent implements OnInit, OnDestroy {
  stats: any = null;
  loading = true;
  error: string | null = null;
  selectedPeriod: number = 7;
  private refreshInterval: any;

  public salesChartOptions: ChartConfiguration['options'] = {
    elements: { line: { tension: 0.4 } },
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false }, title: { display: false } }
  };
  public salesChartType: ChartType = 'line';
  public salesChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Ventas (S/.)',
      backgroundColor: 'rgba(40, 167, 69, 0.1)',
      borderColor: 'rgba(40, 167, 69, 1)',
      pointBackgroundColor: 'rgba(40, 167, 69, 1)',
      fill: 'origin'
    }]
  };

  public statusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };
  public statusChartType: ChartType = 'doughnut';
  public statusChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#f6c23e', '#1cc88a', '#36b9cc', '#4e73df', '#858796', '#e74a3b']
    }]
  };

  public paymentChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };
  public paymentChartType: ChartType = 'pie';
  public paymentChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#4e73df', '#1cc88a', '#f6c23e']
    }]
  };

  public topProductsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    indexAxis: 'y',
    scales: { x: { beginAtZero: true } },
    plugins: { legend: { display: false } }
  };
  public topProductsChartType: ChartType = 'bar';
  public topProductsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Unidades Vendidas',
      backgroundColor: '#28a745',
      borderColor: '#28a745'
    }]
  };

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadStats();
    this.refreshInterval = setInterval(() => this.loadStats(false), 300000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  onPeriodChange(): void {
    this.loadStats();
  }

  loadStats(showLoading = true) {
    if (showLoading) this.loading = true;
    
    this.adminService.getDashboardStats(this.selectedPeriod).subscribe({
      next: (data) => {
        // El servicio ya devuelve directamente el objeto 'data' del backend
        this.stats = data;
        const charts = data.charts;

        if (charts && charts.sales) {
          this.salesChartData.labels = charts.sales.labels;
          this.salesChartData.datasets[0].data = charts.sales.data;
          this.salesChartData = { ...this.salesChartData };
        }

        if (charts && charts.status) {
          this.statusChartData.labels = charts.status.labels;
          this.statusChartData.datasets[0].data = charts.status.data;
          this.statusChartData = { ...this.statusChartData };
        }

        if (charts && charts.payments) {
          this.paymentChartData.labels = charts.payments.labels;
          this.paymentChartData.datasets[0].data = charts.payments.data;
          this.paymentChartData = { ...this.paymentChartData };
        }

        if (charts && charts.topProducts) {
          this.topProductsChartData.labels = charts.topProducts.labels;
          this.topProductsChartData.datasets[0].data = charts.topProducts.data;
          this.topProductsChartData = { ...this.topProductsChartData };
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard stats:', err);
        this.error = 'Error al cargar estadísticas del sistema.';
        this.loading = false;
      }
    });
  }
}
