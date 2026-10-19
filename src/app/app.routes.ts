import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Kamay · Computadoras armadas para lo que haces', loadComponent: () => import('./pages/home') },
  { path: 'equipos', title: 'Equipos · Kamay', loadComponent: () => import('./pages/builds') },
  { path: 'componentes', title: 'Componentes · Kamay', loadComponent: () => import('./pages/components') },
  { path: 'configurador', title: 'Arma tu equipo · Kamay', loadComponent: () => import('./pages/configurator') },
  { path: 'asesor', title: 'Asesor IA · Kamay', loadComponent: () => import('./pages/advisor') },
  { path: 'pedido', title: 'Finalizar pedido · Kamay', loadComponent: () => import('./pages/checkout') },
  { path: 'pedidos', title: 'Pedidos · Kamay', loadComponent: () => import('./pages/orders') },
  { path: 'pedidos/:id', title: 'Seguimiento de pedido · Kamay', loadComponent: () => import('./pages/order') },
  { path: '**', redirectTo: '' },
];
