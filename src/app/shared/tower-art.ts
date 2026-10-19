import { Component, input } from '@angular/core';

let nextId = 0;

/** Original illustration of a glass-panel PC tower, used until real product photography exists. */
@Component({
  selector: 'app-tower-art',
  template: `
    <svg viewBox="0 0 260 360" role="img" [attr.aria-label]="label()" [class]="'tower tower--' + finish()">
      <defs>
        <linearGradient [attr.id]="id + '-glass'" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.16" />
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.04" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0.12" />
        </linearGradient>
        <radialGradient [attr.id]="id + '-glow'">
          <stop offset="0" [attr.stop-color]="glow()" stop-opacity="0.95" />
          <stop offset="1" [attr.stop-color]="glow()" stop-opacity="0" />
        </radialGradient>
      </defs>
      <!-- floor shadow -->
      <ellipse cx="140" cy="342" rx="120" ry="12" fill="#000" opacity="0.28" />
      <!-- top, front and side faces -->
      <polygon class="tower__top" points="40,45 100,62 240,40 180,24" />
      <polygon class="tower__front" points="40,45 100,62 100,338 40,318" />
      <polygon class="tower__side" points="100,62 240,40 240,312 100,338" />
      <!-- interior seen through the glass -->
      <polygon class="tower__inside" points="110,74 230,55 230,300 110,324" />
      <ellipse cx="180" cy="170" rx="70" ry="110" [attr.fill]="'url(#' + id + '-glow)'" opacity="0.55" />
      <polygon class="tower__board" points="160,82 222,72 222,236 160,248" />
      <!-- CPU cooler -->
      <polygon class="tower__part" points="176,118 208,113 208,150 176,156" />
      <ellipse cx="192" cy="134" rx="11" ry="14" [attr.fill]="glow()" opacity="0.9" />
      <!-- front fans -->
      @for (y of [112, 172, 232]; track y) {
        <ellipse [attr.cx]="132" [attr.cy]="y" rx="15" ry="24" class="tower__fan" />
        <ellipse [attr.cx]="132" [attr.cy]="y" rx="10" ry="17" [attr.stroke]="glow()" fill="none" stroke-width="3" />
      }
      <!-- graphics card -->
      <polygon class="tower__gpu" points="150,262 226,250 226,272 150,286" />
      <line x1="156" y1="279" x2="220" y2="268" [attr.stroke]="glow()" stroke-width="2" />
      <!-- glass reflection and edges -->
      <polygon points="100,62 240,40 240,312 100,338" [attr.fill]="'url(#' + id + '-glass)'" />
      <polyline points="100,62 100,338" class="tower__edge" />
      <!-- front details -->
      <line x1="52" y1="70" x2="88" y2="80" class="tower__detail" />
      <circle cx="70" cy="300" r="3" [attr.fill]="glow()" />
    </svg>
  `,
  styles: `
    :host { display: block; }
    svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .tower--dark .tower__top { fill: #2a2a31; }
    .tower--dark .tower__front { fill: #17171c; }
    .tower--dark .tower__side { fill: #1f1f25; }
    .tower--dark .tower__inside { fill: #0c0c10; }
    .tower--dark .tower__board { fill: #1b1b22; }
    .tower--light .tower__top { fill: #ffffff; }
    .tower--light .tower__front { fill: #e7e7ec; }
    .tower--light .tower__side { fill: #f4f4f7; }
    .tower--light .tower__inside { fill: #d9d9e0; }
    .tower--light .tower__board { fill: #ececf1; }
    .tower__part { fill: #2c2c34; }
    .tower--light .tower__part { fill: #c9c9d2; }
    .tower__fan { fill: #121217; }
    .tower--light .tower__fan { fill: #fafafa; }
    .tower__gpu { fill: #26262d; }
    .tower--light .tower__gpu { fill: #bdbdc7; }
    .tower__edge, .tower__detail { stroke: rgba(255, 255, 255, 0.35); stroke-width: 2; fill: none; }
    .tower--light .tower__edge, .tower--light .tower__detail { stroke: rgba(0, 0, 0, 0.12); }
  `,
})
export class TowerArt {
  readonly finish = input<'dark' | 'light'>('dark');
  readonly glow = input('#a78bfa');
  readonly label = input('Ilustración de una torre de PC con panel de vidrio');
  protected readonly id = `tower-${nextId++}`;
}
