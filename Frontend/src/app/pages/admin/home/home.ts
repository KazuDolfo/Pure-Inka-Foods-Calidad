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
      backgroundColor: 'rgba(78, 115, 223, 0.1)',
      borderColor: 'rgba(78, 115, 223, 1)',
      pointBackgroundColor: 'rgba(78, 115, 223, 1)',
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
      backgroundColor: '#4e73df',
      borderColor: '#4e73df'
    }]
  };

  public categoryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'right' } }
  };
  public categoryChartType: ChartType = 'pie';
  public categoryChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796']
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
        this.stats = data;

        if (data.salesChart) {
          this.salesChartData.labels = data.salesChart.labels;
          this.salesChartData.datasets[0].data = data.salesChart.data;
          this.salesChartData = { ...this.salesChartData };
        }

        if (data.statusChart) {
          this.statusChartData.labels = data.statusChart.labels;
          this.statusChartData.datasets[0].data = data.statusChart.data;
          this.statusChartData = { ...this.statusChartData };
        }

        if (data.topProductsChart) {
          this.topProductsChartData.labels = data.topProductsChart.labels;
          this.topProductsChartData.datasets[0].data = data.topProductsChart.data;
          this.topProductsChartData = { ...this.topProductsChartData };
        }

        if (data.categoryChart) {
          this.categoryChartData.labels = data.categoryChart.labels;
          this.categoryChartData.datasets[0].data = data.categoryChart.data;
          this.categoryChartData = { ...this.categoryChartData };
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
