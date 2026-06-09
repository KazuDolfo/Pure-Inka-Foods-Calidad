
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About {
  readonly milestones = [
    { year: 2018, description: 'Fundación de Inkapt, enfocada en la exportación de Maca y Quinua orgánica.' },
    { year: 2020, description: 'Lanzamiento de la línea de productos con valor agregado (cápsulas y polvos especiales).' },
    { year: 2022, description: 'Establecimiento de alianzas de comercio justo con 15 comunidades agrícolas en la sierra de Cusco.' },
    { year: 2024, description: 'Expansión de la tienda en línea y envío internacional a cuatro nuevos países.' },
  ];
}