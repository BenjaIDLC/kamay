import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip-link" href="#main">Saltar al contenido</a>
    <header class="site-header">
      <div class="container site-header__inner">
        <a routerLink="/" class="logo" aria-label="Kamay, inicio">KAMAY</a>
        <nav aria-label="Principal">
          <ul class="nav">
            <li><a routerLink="/equipos" routerLinkActive="is-active" ariaCurrentWhenActive="page">Equipos</a></li>
            <li><a routerLink="/componentes" routerLinkActive="is-active" ariaCurrentWhenActive="page">Componentes</a></li>
            <li><a routerLink="/configurador" routerLinkActive="is-active" ariaCurrentWhenActive="page">Armar</a></li>
            <li><a routerLink="/asesor" class="nav__cta" routerLinkActive="is-active" ariaCurrentWhenActive="page">Asesor IA</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <main id="main" tabindex="-1">
      <router-outlet />
    </main>
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <p><strong>KAMAY</strong> · Proyecto integrador. Prototipo académico.</p>
        <p>Precios referenciales en soles, IGV incluido. El pago, el ensamblaje y la entrega son simulados.</p>
        <p><a routerLink="/pedidos">Gestión de pedidos (demo)</a></p>
      </div>
    </footer>
  `,
})
export class App {}
