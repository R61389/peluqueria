import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="landing">

      <!-- ═══════════ HERO ═══════════ -->
      <section class="hero">
        <div class="hero-bg"></div>

        <!-- Particles -->
        <div class="particles" aria-hidden="true">
          @for (p of particles; track p.id) {
            <span
              class="particle"
              [style.left]="p.left"
              [style.animation-delay]="p.delay"
              [style.animation-duration]="p.duration"
              [style.width]="p.size"
              [style.height]="p.size"
            ></span>
          }
        </div>

        <!-- Scanline beam -->
        <div class="scanline" aria-hidden="true"></div>

        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            IA &bull; Análisis Facial &bull; Try-On Virtual
          </div>

          <h1 class="hero-title">
            BARBERÍA<br>
            <span class="title-gradient">DEL FUTURO</span>
          </h1>

          <p class="hero-sub">
            IA que analiza tu rostro y transforma tu imagen con precisión editorial
          </p>

          <div class="hero-ctas">
            <a routerLink="/login" class="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg>
              Comenzar Gratis
            </a>
            <a href="#features" class="btn-ghost">
              Ver Demo
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
            </a>
          </div>

          <!-- Stats bar -->
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-value">500+</span>
              <span class="stat-label">Estilos</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">6</span>
              <span class="stat-label">Formas Rostro</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">IA</span>
              <span class="stat-label">Tiempo Real</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">Try-On</span>
              <span class="stat-label">Virtual</span>
            </div>
          </div>
        </div>

        <!-- Floating scissors SVG -->
        <div class="scissors-float" aria-hidden="true">
          <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
            <circle cx="18" cy="26" r="10" stroke="#c9a96e" stroke-width="1.5" opacity="0.7"/>
            <circle cx="18" cy="54" r="10" stroke="#c9a96e" stroke-width="1.5" opacity="0.7"/>
            <line x1="26" y1="20" x2="70" y2="54" stroke="#c9a96e" stroke-width="1.5" opacity="0.7"/>
            <line x1="26" y1="60" x2="70" y2="26" stroke="#c9a96e" stroke-width="1.5" opacity="0.7"/>
            <circle cx="18" cy="26" r="4" fill="#c9a96e" opacity="0.5"/>
            <circle cx="18" cy="54" r="4" fill="#c9a96e" opacity="0.5"/>
          </svg>
        </div>

        <!-- Scroll indicator -->
        <div class="scroll-indicator" aria-label="Scroll down">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </section>

      <!-- ═══════════ FEATURES BENTO ═══════════ -->
      <section class="features" id="features">
        <div class="section-header">
          <span class="section-eyebrow">Tecnología</span>
          <h2 class="section-title">Una suite completa<br><span class="title-gradient">de imagen personal</span></h2>
        </div>

        <div class="bento">
          <!-- Card 1 — large -->
          <div class="bento-card card-large bento-card-1">
            <div class="card-inner">
              <div class="card-icon-area">
                <svg class="face-scan-svg" viewBox="0 0 200 200" fill="none">
                  <ellipse cx="100" cy="105" rx="55" ry="70" stroke="#c9a96e" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.5"/>
                  <ellipse cx="100" cy="105" rx="40" ry="52" stroke="rgba(201,169,110,0.3)" stroke-width="1" stroke-dasharray="3 4"/>
                  <line x1="65" y1="90" x2="85" y2="90" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
                  <line x1="115" y1="90" x2="135" y2="90" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
                  <path d="M 100 98 L 93 118 Q 100 122 107 118 Z" stroke="#c9a96e" stroke-width="1" fill="none" opacity="0.6"/>
                  <path d="M 85 130 Q 100 140 115 130" stroke="#c9a96e" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8"/>
                  <path d="M 30 40 L 30 25 L 45 25" stroke="#c9a96e" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>
                  <path d="M 155 25 L 170 25 L 170 40" stroke="#c9a96e" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>
                  <path d="M 30 160 L 30 175 L 45 175" stroke="#c9a96e" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>
                  <path d="M 155 175 L 170 175 L 170 160" stroke="#c9a96e" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>
                  <line class="scan-line-anim" x1="30" y1="100" x2="170" y2="100" stroke="rgba(201,169,110,0.5)" stroke-width="1"/>
                  <circle cx="100" cy="45" r="2.5" fill="#c9a96e" opacity="0.8"/>
                  <circle cx="70" cy="88" r="2" fill="#c9a96e" opacity="0.7"/>
                  <circle cx="130" cy="88" r="2" fill="#c9a96e" opacity="0.7"/>
                  <circle cx="100" cy="165" r="2.5" fill="#c9a96e" opacity="0.8"/>
                </svg>
              </div>
              <div class="card-text">
                <span class="card-eyebrow">Precisión milimétrica</span>
                <h3 class="card-heading">Análisis Facial IA</h3>
                <p class="card-desc">Detecta tu forma de rostro, simetría, tono y subtono de piel con modelos de visión computacional.</p>
                <div class="card-tags">
                  <span class="tag">Forma de rostro</span>
                  <span class="tag">Simetría</span>
                  <span class="tag">Tono de piel</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 2 -->
          <div class="bento-card bento-card-2">
            <div class="card-inner">
              <div class="color-swatches">
                @for (c of colorSwatches; track c) {
                  <div class="swatch-anim" [style.background]="c" [style.animation-delay]="($index * 150) + 'ms'"></div>
                }
              </div>
              <h3 class="card-heading sm">Colorimetría</h3>
              <p class="card-desc sm">Tu paleta de temporada, metales ideales y colores a evitar.</p>
            </div>
          </div>

          <!-- Card 3 -->
          <div class="bento-card bento-card-3">
            <div class="card-inner">
              <div class="split-preview">
                <div class="split-before"><span>Antes</span></div>
                <div class="split-after"><span>Después</span></div>
                <div class="split-handle"></div>
              </div>
              <h3 class="card-heading sm">Try-On Virtual</h3>
              <p class="card-desc sm">Prueba peinados y estilos antes de decidirte.</p>
            </div>
          </div>

          <!-- Card 4 -->
          <div class="bento-card bento-card-4">
            <div class="card-inner">
              <div class="calendar-icon">
                <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
                  <rect x="5" y="10" width="50" height="44" rx="8" stroke="#c9a96e" stroke-width="1.5"/>
                  <line x1="5" y1="22" x2="55" y2="22" stroke="#c9a96e" stroke-width="1.5" opacity="0.5"/>
                  <rect x="17" y="5" width="6" height="12" rx="3" fill="#c9a96e" opacity="0.8"/>
                  <rect x="37" y="5" width="6" height="12" rx="3" fill="#c9a96e" opacity="0.8"/>
                  <circle cx="20" cy="35" r="3" fill="#c9a96e" opacity="0.7"/>
                  <circle cx="30" cy="35" r="3" fill="rgba(201,169,110,0.4)" opacity="0.7"/>
                  <circle cx="40" cy="35" r="3" fill="rgba(201,169,110,0.4)" opacity="0.7"/>
                  <circle cx="20" cy="46" r="3" fill="rgba(201,169,110,0.4)" opacity="0.7"/>
                  <circle cx="30" cy="46" r="3" fill="#c9a96e" opacity="0.7"/>
                </svg>
              </div>
              <h3 class="card-heading sm">Agenda tu Cita</h3>
              <p class="card-desc sm">Reserva en segundos con tu barbero de confianza.</p>
            </div>
          </div>

          <!-- Card 5 — large -->
          <div class="bento-card card-large bento-card-5">
            <div class="card-inner card-inner-row">
              <div class="card-text">
                <span class="card-eyebrow">360° de imagen</span>
                <h3 class="card-heading">Estilismo Personalizado</h3>
                <p class="card-desc">Recomendaciones de ropa, colores y accesorios que armonizan con tu tipo de color natural.</p>
                <a routerLink="/login" class="card-cta">Explorar ahora →</a>
              </div>
              <div class="floating-items" aria-hidden="true">
                <div class="float-item fi1">👔</div>
                <div class="float-item fi2">👗</div>
                <div class="float-item fi3">🧥</div>
                <div class="float-item fi4">👒</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════ HOW IT WORKS ═══════════ -->
      <section class="how-it-works">
        <div class="section-header">
          <span class="section-eyebrow">Proceso</span>
          <h2 class="section-title">Tres pasos hacia<br><span class="title-gradient">tu mejor versión</span></h2>
        </div>

        <div class="steps">
          <div class="step">
            <div class="step-number">01</div>
            <div class="step-content">
              <div class="step-icon">
                <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
                  <rect x="8" y="8" width="32" height="32" rx="6" stroke="#c9a96e" stroke-width="1.5"/>
                  <circle cx="24" cy="22" r="7" stroke="#c9a96e" stroke-width="1.5"/>
                  <path d="M 13 40 Q 24 30 35 40" stroke="#c9a96e" stroke-width="1.5" fill="none"/>
                </svg>
              </div>
              <h3 class="step-title">Sube tu foto</h3>
              <p class="step-desc">Una sola selfie frontal clara es todo lo que necesitamos para comenzar.</p>
            </div>
          </div>

          <div class="step-connector" aria-hidden="true">
            <div class="connector-line">
              <div class="connector-dot cd1"></div>
              <div class="connector-dot cd2"></div>
              <div class="connector-dot cd3"></div>
            </div>
          </div>

          <div class="step">
            <div class="step-number">02</div>
            <div class="step-content">
              <div class="step-icon">
                <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
                  <circle cx="24" cy="24" r="16" stroke="#c9a96e" stroke-width="1.5" stroke-dasharray="3 3"/>
                  <path d="M 16 24 L 20 28 L 28 20" stroke="#c9a96e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="24" cy="8" r="3" fill="#c9a96e" opacity="0.7"/>
                  <circle cx="38" cy="18" r="2" fill="#c9a96e" opacity="0.5"/>
                </svg>
              </div>
              <h3 class="step-title">IA analiza tu rostro</h3>
              <p class="step-desc">Nuestros modelos detectan forma, proporción, tono y más de 30 características faciales.</p>
            </div>
          </div>

          <div class="step-connector" aria-hidden="true">
            <div class="connector-line">
              <div class="connector-dot cd1"></div>
              <div class="connector-dot cd2"></div>
              <div class="connector-dot cd3"></div>
            </div>
          </div>

          <div class="step">
            <div class="step-number">03</div>
            <div class="step-content">
              <div class="step-icon">
                <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
                  <path d="M 8 36 L 16 24 L 24 30 L 32 16 L 40 20" stroke="#c9a96e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="40" cy="12" r="6" fill="rgba(201,169,110,0.2)" stroke="#c9a96e" stroke-width="1.5"/>
                  <path d="M 37 12 L 39.5 14.5 L 43 11" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              <h3 class="step-title">Descubre tu mejor versión</h3>
              <p class="step-desc">Recibe peinados, colores, estilismo y agenda tu cita en un solo lugar.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════ SOCIAL PROOF ═══════════ -->
      <section class="social-proof">
        <div class="proof-stats">
          <div class="proof-stat">
            <span class="ps-value">10,000+</span>
            <span class="ps-label">análisis realizados</span>
          </div>
          <div class="proof-stat">
            <span class="ps-value">98%</span>
            <span class="ps-label">satisfacción</span>
          </div>
          <div class="proof-stat">
            <span class="ps-value">500+</span>
            <span class="ps-label">estilos disponibles</span>
          </div>
        </div>

        <div class="testimonials">
          <div class="testimonial-card tc1">
            <div class="test-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="test-text">"El análisis facial fue increíblemente preciso. Me ayudó a elegir el corte perfecto que nunca hubiera considerado."</p>
            <div class="test-author">
              <div class="test-avatar" style="background:linear-gradient(135deg,#c9a96e,#7c3aed)">A</div>
              <div>
                <span class="test-name">Alejandro M.</span>
                <span class="test-role">Cliente verificado</span>
              </div>
            </div>
          </div>

          <div class="testimonial-card tc2">
            <div class="test-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="test-text">"La colorimetría cambió completamente mi forma de vestir. Ahora sé exactamente qué colores me favorecen."</p>
            <div class="test-author">
              <div class="test-avatar" style="background:linear-gradient(135deg,#a855f7,#3b82f6)">S</div>
              <div>
                <span class="test-name">Sofía R.</span>
                <span class="test-role">Cliente verificada</span>
              </div>
            </div>
          </div>

          <div class="testimonial-card tc3">
            <div class="test-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="test-text">"El try-on virtual me ahorró meses de indecisión. Vi exactamente cómo me vería antes de cortarme."</p>
            <div class="test-author">
              <div class="test-avatar" style="background:linear-gradient(135deg,#10b981,#0ea5e9)">C</div>
              <div>
                <span class="test-name">Carlos V.</span>
                <span class="test-role">Cliente verificado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════ CTA ═══════════ -->
      <section class="cta-section">
        <div class="cta-bg"></div>
        <div class="cta-content">
          <span class="section-eyebrow">Comienza hoy</span>
          <h2 class="cta-title">¿Listo para tu<br><span class="title-gradient">transformación?</span></h2>
          <p class="cta-sub">Sin tarjeta de crédito. Sin compromisos. Solo resultados.</p>
          <a routerLink="/login" class="btn-primary btn-xl">
            Comenzar Gratis — Es Gratis
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </section>

      <!-- ═══════════ FOOTER ═══════════ -->
      <footer class="footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <span class="brand-mark">&#10022;</span>
            <span class="brand-name">BARBERÍA IA</span>
          </div>
          <nav class="footer-nav">
            <a routerLink="/login">Iniciar Sesión</a>
            <a routerLink="/login">Registro</a>
            <span class="footer-divider">&middot;</span>
            <span class="footer-copy">&copy; 2026 Barbería IA</span>
          </nav>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0}

    :host{
      display:block;
      font-family:'Inter','Segoe UI',sans-serif;
      background:#080810;
      color:#f0eff4;
      overflow-x:hidden;
    }

    a{text-decoration:none;color:inherit}

    /* ─── TYPOGRAPHY ─── */
    .title-gradient{
      background:linear-gradient(135deg,#c9a96e 0%,#e8c990 40%,#a855f7 100%);
      -webkit-background-clip:text;
      -webkit-text-fill-color:transparent;
      background-clip:text;
    }

    .section-eyebrow{
      display:inline-block;
      font-size:11px;font-weight:600;
      letter-spacing:.18em;text-transform:uppercase;
      color:#c9a96e;
      border:1px solid rgba(201,169,110,.3);
      padding:4px 12px;border-radius:20px;
      margin-bottom:20px;
    }

    .section-header{text-align:center;margin-bottom:60px}

    .section-title{
      font-family:'Playfair Display',Georgia,serif;
      font-size:clamp(32px,5vw,52px);font-weight:700;
      line-height:1.15;color:#f0eff4;
    }

    /* ─── BUTTONS ─── */
    .btn-primary{
      display:inline-flex;align-items:center;gap:10px;
      background:linear-gradient(135deg,#c9a96e,#e8c990);
      color:#0a0a0f;font-weight:700;font-size:15px;
      padding:14px 28px;border-radius:50px;
      transition:transform .2s,box-shadow .2s;
      box-shadow:0 0 40px rgba(201,169,110,.3);cursor:pointer;
    }
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 40px rgba(201,169,110,.5)}
    .btn-xl{font-size:17px;padding:18px 36px}

    .btn-ghost{
      display:inline-flex;align-items:center;gap:8px;
      background:transparent;color:#f0eff4;font-weight:600;font-size:15px;
      padding:14px 24px;border-radius:50px;
      border:1px solid rgba(255,255,255,.15);
      transition:border-color .2s,background .2s;cursor:pointer;
    }
    .btn-ghost:hover{border-color:rgba(201,169,110,.5);background:rgba(201,169,110,.05)}

    /* ─── HERO ─── */
    .hero{
      position:relative;min-height:100vh;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      overflow:hidden;padding:80px 24px 100px;
    }

    .hero-bg{
      position:absolute;inset:0;
      background:linear-gradient(-45deg,#080810,#12081a,#0a1020,#16100a,#080810);
      background-size:400% 400%;
      animation:mesh-move 12s ease infinite;z-index:0;
    }
    .hero-bg::after{
      content:'';position:absolute;inset:0;
      background:
        radial-gradient(ellipse 60% 50% at 50% 30%,rgba(201,169,110,.06) 0%,transparent 70%),
        radial-gradient(ellipse 40% 40% at 80% 60%,rgba(124,58,237,.08) 0%,transparent 60%),
        radial-gradient(ellipse 30% 30% at 20% 70%,rgba(168,85,247,.05) 0%,transparent 60%);
    }

    @keyframes mesh-move{
      0%{background-position:0% 50%}
      50%{background-position:100% 50%}
      100%{background-position:0% 50%}
    }

    .particles{position:absolute;inset:0;pointer-events:none;z-index:1}

    .particle{
      position:absolute;
      background:rgba(201,169,110,.6);
      border-radius:50%;
      animation:particle-float linear infinite;
    }

    @keyframes particle-float{
      0%{transform:translateY(100vh) scale(0);opacity:0}
      5%{opacity:1}
      90%{opacity:.8}
      100%{transform:translateY(-120px) scale(1.2);opacity:0}
    }

    .scanline{
      position:absolute;top:0;left:-100%;width:60%;height:1px;
      background:linear-gradient(90deg,transparent,rgba(201,169,110,.4),transparent);
      animation:scanline-sweep 8s linear infinite;z-index:1;
    }

    @keyframes scanline-sweep{
      0%{top:15%;left:-60%}
      100%{top:85%;left:120%}
    }

    .hero-content{
      position:relative;z-index:2;
      text-align:center;max-width:820px;
    }

    .hero-badge{
      display:inline-flex;align-items:center;gap:10px;
      background:rgba(255,255,255,.05);
      border:1px solid rgba(201,169,110,.2);
      border-radius:50px;padding:8px 20px;
      font-size:12px;font-weight:500;color:#c9a96e;letter-spacing:.05em;
      margin-bottom:36px;opacity:0;
    }

    .badge-dot{
      width:6px;height:6px;background:#c9a96e;border-radius:50%;
      animation:dot-pulse 2s ease infinite;
    }

    @keyframes dot-pulse{
      0%,100%{opacity:1;transform:scale(1)}
      50%{opacity:.5;transform:scale(1.5)}
    }

    .hero-title{
      font-family:'Playfair Display',Georgia,serif;
      font-size:clamp(56px,10vw,100px);font-weight:900;
      line-height:1;letter-spacing:-.02em;color:#f0eff4;
      margin-bottom:28px;opacity:0;
    }

    .hero-sub{
      font-size:clamp(16px,2.5vw,22px);color:rgba(240,239,244,.6);
      line-height:1.6;margin-bottom:40px;opacity:0;
    }

    .hero-ctas{
      display:flex;gap:16px;justify-content:center;flex-wrap:wrap;
      margin-bottom:64px;opacity:0;
    }

    .hero-stats{
      display:flex;align-items:center;justify-content:center;flex-wrap:wrap;
      background:rgba(255,255,255,.03);
      border:1px solid rgba(255,255,255,.07);
      border-radius:16px;padding:16px 32px;gap:8px;opacity:0;
    }

    .stat-item{
      display:flex;flex-direction:column;align-items:center;padding:0 24px;
    }
    .stat-value{font-size:22px;font-weight:800;color:#c9a96e;line-height:1}
    .stat-label{font-size:11px;color:rgba(240,239,244,.4);text-transform:uppercase;letter-spacing:.08em;margin-top:4px}
    .stat-divider{width:1px;height:36px;background:rgba(255,255,255,.07)}

    .scissors-float{
      position:absolute;top:15%;right:8%;z-index:2;
      animation:scissors-float-anim 6s ease-in-out infinite;opacity:.6;
    }

    @keyframes scissors-float-anim{
      0%,100%{transform:translateY(0) rotate(-5deg)}
      50%{transform:translateY(-20px) rotate(5deg)}
    }

    .scroll-indicator{
      position:absolute;bottom:32px;left:50%;transform:translateX(-50%);
      z-index:2;color:rgba(201,169,110,.6);
      animation:bounce 2s ease infinite;
    }

    @keyframes bounce{
      0%,100%{transform:translateX(-50%) translateY(0)}
      50%{transform:translateX(-50%) translateY(8px)}
    }

    /* ─── FEATURES ─── */
    .features{padding:100px 24px;max-width:1200px;margin:0 auto}

    .bento{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:16px;
    }

    .card-large{grid-column:span 2}

    @media(max-width:900px){
      .bento{grid-template-columns:repeat(2,1fr)}
      .card-large{grid-column:span 2}
    }

    @media(max-width:600px){
      .bento{grid-template-columns:1fr}
      .card-large{grid-column:span 1}
    }

    .bento-card{
      background:rgba(255,255,255,.03);
      border:1px solid rgba(255,255,255,.07);
      border-radius:24px;padding:32px;
      position:relative;overflow:hidden;
      transition:border-color .3s,transform .3s,box-shadow .3s;
      opacity:0;cursor:default;
    }

    .bento-card::before{
      content:'';position:absolute;inset:0;
      background:radial-gradient(circle at 50% 0%,rgba(201,169,110,.04),transparent 70%);
      opacity:0;transition:opacity .3s;
    }

    .bento-card:hover{
      border-color:rgba(201,169,110,.3);
      transform:translateY(-4px);
      box-shadow:0 20px 60px rgba(0,0,0,.4),0 0 0 1px rgba(201,169,110,.1);
    }

    .bento-card:hover::before{opacity:1}

    .card-inner{display:flex;flex-direction:column;height:100%;gap:20px}
    .card-inner-row{flex-direction:row;align-items:center;justify-content:space-between}

    .card-eyebrow{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#c9a96e;font-weight:600}

    .card-heading{
      font-family:'Playfair Display',Georgia,serif;
      font-size:28px;font-weight:700;color:#f0eff4;line-height:1.2;
    }
    .card-heading.sm{font-size:20px}

    .card-desc{font-size:14px;color:rgba(240,239,244,.5);line-height:1.6}
    .card-desc.sm{font-size:13px}

    .card-tags{display:flex;flex-wrap:wrap;gap:8px}

    .tag{
      font-size:11px;padding:4px 10px;border-radius:20px;
      background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.2);
      color:#c9a96e;font-weight:500;
    }

    .card-cta{font-size:14px;font-weight:600;color:#c9a96e;letter-spacing:.02em;transition:letter-spacing .2s}
    .card-cta:hover{letter-spacing:.06em}

    .card-icon-area{flex:0 0 auto}

    .face-scan-svg{width:200px;height:200px;flex-shrink:0}

    .scan-line-anim{animation:scan-v 3s ease-in-out infinite;transform-origin:center}

    @keyframes scan-v{
      0%,100%{transform:translateY(-40px);opacity:.2}
      50%{transform:translateY(40px);opacity:.8}
    }

    .color-swatches{display:flex;gap:6px;flex-wrap:wrap}

    .swatch-anim{
      width:40px;height:60px;border-radius:20px;
      animation:swatch-rise 1.5s ease-out forwards;opacity:0;
    }

    @keyframes swatch-rise{
      from{transform:scaleY(.2);opacity:0}
      to{transform:scaleY(1);opacity:1}
    }

    .split-preview{
      position:relative;width:100%;height:80px;
      border-radius:12px;overflow:hidden;
      border:1px solid rgba(255,255,255,.08);
    }

    .split-before{
      position:absolute;left:0;top:0;width:50%;height:100%;
      background:linear-gradient(135deg,#1a1a2e,#16213e);
      display:flex;align-items:center;justify-content:center;
    }
    .split-before span{font-size:11px;color:rgba(255,255,255,.4)}

    .split-after{
      position:absolute;right:0;top:0;width:50%;height:100%;
      background:linear-gradient(135deg,#0f3460,#533483);
      display:flex;align-items:center;justify-content:center;
    }
    .split-after span{font-size:11px;color:rgba(255,255,255,.6)}

    .split-handle{
      position:absolute;left:50%;top:0;width:2px;height:100%;
      background:#c9a96e;transform:translateX(-50%);
    }
    .split-handle::before,.split-handle::after{
      content:'';position:absolute;left:50%;
      transform:translateX(-50%);
      width:10px;height:10px;background:#c9a96e;border-radius:50%;
    }
    .split-handle::before{top:calc(50% - 12px)}
    .split-handle::after{top:calc(50% + 4px)}

    .calendar-icon{display:flex;justify-content:center}

    .floating-items{display:flex;flex-direction:column;gap:12px;flex-shrink:0}

    .float-item{font-size:28px;animation:float-item-anim ease-in-out infinite;opacity:.8}
    .fi1{animation-duration:4s;animation-delay:0s}
    .fi2{animation-duration:5s;animation-delay:.5s}
    .fi3{animation-duration:4.5s;animation-delay:1s}
    .fi4{animation-duration:3.8s;animation-delay:1.5s}

    @keyframes float-item-anim{
      0%,100%{transform:translateY(0) rotate(-3deg)}
      50%{transform:translateY(-8px) rotate(3deg)}
    }

    /* ─── HOW IT WORKS ─── */
    .how-it-works{padding:100px 24px;max-width:1100px;margin:0 auto}

    .steps{display:flex;align-items:center}

    @media(max-width:700px){.steps{flex-direction:column;gap:8px}}

    .step{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:20px;opacity:0}

    .step-number{
      font-family:'Playfair Display',Georgia,serif;
      font-size:72px;font-weight:900;
      background:linear-gradient(135deg,rgba(201,169,110,.2),rgba(201,169,110,.05));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      line-height:1;
    }

    .step-content{display:flex;flex-direction:column;align-items:center;gap:12px}

    .step-icon{
      width:64px;height:64px;
      background:rgba(201,169,110,.07);
      border:1px solid rgba(201,169,110,.2);
      border-radius:18px;
      display:flex;align-items:center;justify-content:center;
    }

    .step-title{font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#f0eff4}
    .step-desc{font-size:14px;color:rgba(240,239,244,.5);line-height:1.6;max-width:220px}

    .step-connector{
      flex:0 0 80px;display:flex;align-items:center;justify-content:center;
    }

    @media(max-width:700px){.step-connector{flex:0 0 32px;transform:rotate(90deg)}}

    .connector-line{display:flex;align-items:center;gap:6px}

    .connector-dot{
      width:6px;height:6px;border-radius:50%;
      background:rgba(201,169,110,.4);
      animation:connector-pulse 2s ease infinite;
    }
    .cd2{animation-delay:.3s}
    .cd3{animation-delay:.6s}

    @keyframes connector-pulse{
      0%,100%{opacity:.3;transform:scale(.8)}
      50%{opacity:1;transform:scale(1.2)}
    }

    /* ─── SOCIAL PROOF ─── */
    .social-proof{padding:80px 24px;max-width:1100px;margin:0 auto}

    .proof-stats{display:flex;justify-content:center;gap:64px;margin-bottom:60px;flex-wrap:wrap}

    .proof-stat{text-align:center}
    .ps-value{
      display:block;
      font-family:'Playfair Display',Georgia,serif;
      font-size:48px;font-weight:900;
      background:linear-gradient(135deg,#c9a96e,#e8c990);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .ps-label{display:block;font-size:13px;color:rgba(240,239,244,.4);text-transform:uppercase;letter-spacing:.1em;margin-top:4px}

    .testimonials{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}

    @media(max-width:800px){.testimonials{grid-template-columns:1fr}}

    .testimonial-card{
      background:rgba(255,255,255,.03);
      border:1px solid rgba(255,255,255,.07);
      border-radius:20px;padding:28px;
      display:flex;flex-direction:column;gap:16px;
      transition:border-color .3s;opacity:0;
    }
    .testimonial-card:hover{border-color:rgba(201,169,110,.2)}

    .test-stars{color:#c9a96e;font-size:14px;letter-spacing:2px}
    .test-text{font-size:14px;color:rgba(240,239,244,.7);line-height:1.7;flex:1;font-style:italic}

    .test-author{display:flex;align-items:center;gap:12px}
    .test-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:white;flex-shrink:0}
    .test-name{display:block;font-size:13px;font-weight:600;color:#f0eff4}
    .test-role{display:block;font-size:11px;color:rgba(240,239,244,.3)}

    /* ─── CTA ─── */
    .cta-section{position:relative;padding:120px 24px;text-align:center;overflow:hidden}

    .cta-bg{
      position:absolute;inset:0;
      background:linear-gradient(-45deg,#0a0a0f,#12081a,#0a1020,#080810);
      background-size:400% 400%;
      animation:mesh-move 10s ease infinite;
    }
    .cta-bg::after{
      content:'';position:absolute;inset:0;
      background:radial-gradient(ellipse 70% 60% at 50% 50%,rgba(201,169,110,.08) 0%,transparent 70%);
    }

    .cta-content{
      position:relative;z-index:1;max-width:700px;margin:0 auto;
      display:flex;flex-direction:column;align-items:center;gap:24px;
    }

    .cta-title{font-family:'Playfair Display',Georgia,serif;font-size:clamp(40px,6vw,64px);font-weight:900;line-height:1.1}
    .cta-sub{font-size:16px;color:rgba(240,239,244,.45)}

    /* ─── FOOTER ─── */
    .footer{border-top:1px solid rgba(255,255,255,.06);padding:32px 24px}

    .footer-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}

    .footer-brand{display:flex;align-items:center;gap:10px}
    .brand-mark{color:#c9a96e;font-size:18px}
    .brand-name{font-size:13px;font-weight:700;letter-spacing:.15em;color:rgba(240,239,244,.7)}

    .footer-nav{display:flex;align-items:center;gap:20px;font-size:13px;color:rgba(240,239,244,.4)}
    .footer-nav a{color:rgba(240,239,244,.5);transition:color .2s}
    .footer-nav a:hover{color:#c9a96e}
    .footer-divider{opacity:.3}

    @media (max-width: 768px) {
      .hero { padding: 60px 16px 80px; }
      .hero-title { font-size: clamp(40px, 12vw, 72px); }
      .hero-ctas { flex-direction: column; align-items: center; }
      .hero-stats { padding: 12px 16px; gap: 4px; }
      .stat-item { padding: 0 12px; }
      .stat-value { font-size: 18px; }
      .features { padding: 60px 16px; }
      .section-header { margin-bottom: 36px; }
      .how-it-works { padding: 60px 16px; }
      .social-proof { padding: 48px 16px; }
      .proof-stats { gap: 32px; }
      .ps-value { font-size: 36px; }
      .testimonials { grid-template-columns: 1fr; }
      .cta-section { padding: 80px 16px; }
      .footer-inner { flex-direction: column; align-items: center; text-align: center; }
      .scissors-float { display: none; }
    }

    @media (max-width: 480px) {
      .hero { padding: 48px 12px 60px; }
      .hero-badge { font-size: 10px; padding: 6px 14px; }
      .hero-ctas .btn-primary, .hero-ctas .btn-ghost { width: 100%; justify-content: center; }
      .hero-stats { flex-direction: column; gap: 8px; }
      .stat-divider { display: none; }
      .bento-card { padding: 20px; border-radius: 16px; }
      .card-heading { font-size: 22px; }
      .card-inner-row { flex-direction: column; }
      .floating-items { flex-direction: row; justify-content: center; }
      .proof-stats { flex-direction: column; gap: 16px; }
      .testimonial-card { padding: 20px; border-radius: 16px; }
    }
  `],
})
export class LandingComponent implements OnInit, AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${Math.floor(Math.random() * 100)}%`,
    delay: `${(Math.random() * 15).toFixed(1)}s`,
    duration: `${(12 + Math.random() * 10).toFixed(1)}s`,
    size: `${(1.5 + Math.random() * 2.5).toFixed(1)}px`,
  }));

  readonly colorSwatches = [
    '#E8C8A8','#D4956A','#8B5E3C',
    '#C9A96E','#7C5CBF','#3B82F6',
    '#10B981','#F59E0B',
  ];

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/advisor']);
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.runAnimations();
  }

  private runAnimations(): void {
    import('motion').then(({ animate, inView }) => {
      const badge = document.querySelector<HTMLElement>('.hero-badge');
      const title = document.querySelector<HTMLElement>('.hero-title');
      const sub   = document.querySelector<HTMLElement>('.hero-sub');
      const ctas  = document.querySelector<HTMLElement>('.hero-ctas');
      const stats = document.querySelector<HTMLElement>('.hero-stats');

      if (badge) animate(badge, { opacity:[0,1], y:[20,0] }, { duration:0.6, delay:0.1 });
      if (title) animate(title, { opacity:[0,1], y:[40,0] }, { duration:0.8, delay:0.25 });
      if (sub)   animate(sub,   { opacity:[0,1], y:[30,0] }, { duration:0.8, delay:0.45 });
      if (ctas)  animate(ctas,  { opacity:[0,1], y:[20,0] }, { duration:0.6, delay:0.65 });
      if (stats) animate(stats, { opacity:[0,1], y:[16,0] }, { duration:0.6, delay:0.85 });

      document.querySelectorAll<HTMLElement>('.bento-card').forEach((card, i) => {
        inView(card, () => {
          animate(card, { opacity:[0,1], y:[40,0], scale:[0.97,1] }, { duration:0.55, delay:i*0.1 });
        }, { margin:'-60px' });
      });

      document.querySelectorAll<HTMLElement>('.step').forEach((step, i) => {
        inView(step, () => {
          animate(step, { opacity:[0,1], x:[-30,0] }, { duration:0.55, delay:i*0.15 });
        }, { margin:'-40px' });
      });

      document.querySelectorAll<HTMLElement>('.testimonial-card').forEach((card, i) => {
        inView(card, () => {
          animate(card, { opacity:[0,1], y:[30,0] }, { duration:0.5, delay:i*0.1 });
        }, { margin:'-40px' });
      });
    });
  }
}
