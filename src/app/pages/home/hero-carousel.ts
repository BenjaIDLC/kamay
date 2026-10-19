import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TowerArt } from '../../shared/tower-art';

type Slide = {
  theme: 'violet' | 'carbon' | 'ocean';
  align: 'left' | 'right';
  art: 'advisor' | 'checks' | 'lineup';
  headline: string;
  sub: string;
  ctas: { label: string; link: string }[];
};

const AUTOPLAY_MS = 9000;

@Component({
  selector: 'app-hero-carousel',
  imports: [RouterLink, TowerArt],
  host: {
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
    '(focusin)': 'focused.set(true)',
    '(focusout)': 'focused.set(false)',
  },
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.scss',
})
export class HeroCarousel {
  protected readonly slides: Slide[] = [
    {
      theme: 'violet', align: 'left', art: 'advisor',
      headline: 'Cuéntanos qué haces. Nosotros armamos el equipo.',
      sub: 'Nuestro asesor con IA te pregunta por tus programas y tu presupuesto, y te propone una configuración validada.',
      ctas: [{ label: 'Hablar con el asesor', link: '/asesor' }, { label: 'Ver equipos', link: '/equipos' }],
    },
    {
      theme: 'carbon', align: 'right', art: 'checks',
      headline: 'Cada pieza, comprobada antes de comprar.',
      sub: 'Cambia el procesador, la tarjeta o la fuente: revisamos socket, memoria, espacio y potencia en cada cambio.',
      ctas: [{ label: 'Arma tu equipo', link: '/configurador' }, { label: 'Ver componentes', link: '/componentes' }],
    },
    {
      theme: 'ocean', align: 'left', art: 'lineup',
      headline: 'Un punto de partida para cada mundo.',
      sub: 'Equipos base para diseño gráfico, render 3D y gaming. Pídelos tal cual o personalízalos pieza por pieza.',
      ctas: [{ label: 'Explorar equipos', link: '/equipos' }, { label: 'Armar desde cero', link: '/configurador' }],
    },
  ];
  protected readonly checks = ['Socket AM5', 'Memoria DDR5', 'GPU 242 mm / 360 mm', 'Fuente 750 W'];

  protected readonly current = signal(0);
  /** User choice: false once they press pause. */
  protected readonly playing = signal(true);
  protected readonly hovered = signal(false);
  protected readonly focused = signal(false);
  private readonly reducedMotion = signal(false);
  /** Rotation only runs when nobody is reading or interacting with the hero. */
  protected readonly rotating = computed(() => this.playing() && !this.reducedMotion() && !this.hovered() && !this.focused());

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const query = matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.set(query.matches);
      const timer = setInterval(() => { if (this.rotating()) this.next(); }, AUTOPLAY_MS);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
  }

  protected go(index: number) {
    this.current.set((index + this.slides.length) % this.slides.length);
  }

  protected next() {
    this.go(this.current() + 1);
  }

  protected previous() {
    this.go(this.current() - 1);
  }
}
