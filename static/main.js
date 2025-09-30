// === main.js ===
document.addEventListener('DOMContentLoaded', function () {

  function genEID(){ return 'evt-' + Date.now() + '-' + Math.floor(Math.random()*1e9); }

  // Helpers para persistir contexto de checkout (sobrevive entre pestañas del mismo navegador)
  function mapValueByProcessor(proc){
    switch ((proc||'').toLowerCase()){
      case 'antel': return 80;
      case 'movistar': return 70;
      case 'mercado_pago': return 100;
      default: return 80; // fallback general solicitado
    }
  }
  function persistLastCheckoutContext(ctx){
    try {
      var payload = {
        proc: (ctx.proc || ''),
        alias: (ctx.alias || ''),
        value: (typeof ctx.value === 'number' ? ctx.value : null),
        currency: (ctx.currency || 'UYU'),
        ts: Date.now()
      };
      localStorage.setItem('smsr_last_checkout', JSON.stringify(payload));
    } catch(e) { /* noop */ }
  }

// === InitiateCheckout con dedupe y test opcional ===
function trackBeginCheckout(procesadora) {
  const eid = genEID(); // ID NUEVO por cada evento de checkout

  // Normalizamos procesadora y resolvemos alias visible
  const procNorm = (procesadora || 'desconocida').toLowerCase();
  const aliasActual = (typeof alias !== 'undefined' && alias) ? alias : (document.body && document.body.dataset ? (document.body.dataset.alias || '') : '');

  // Calculamos value según procesadora y persistimos contexto para reutilizar en purchase
  const valueByProc = mapValueByProcessor(procNorm);
  persistLastCheckoutContext({ proc: procNorm, alias: aliasActual, value: valueByProc, currency: 'UYU' });

  // Debug: console.log('🔔 BEGIN_CHECKOUT - Calculando value:', { procesadora: procNorm, valueByProc, alias: aliasActual });

  // 1) Mandar al dataLayer (para GA4 → SS → CAPI con el MISMO event_id)
  window.dataLayer = window.dataLayer || [];
  const beginCheckoutData = {
    event: 'begin_checkout',
    event_id: eid,
    value: valueByProc,
    currency: 'UYU',
    country: 'uy',
    procesadora: procNorm,
    alias: aliasActual,
    // UPD mínima: external_id de 1ª parte (se hashea en sGTM por la transformación)
    user_data: { external_id: (window.smsr_uid || '') }
  };
  
  // Debug: console.log('🔔 BEGIN_CHECKOUT - Enviando al dataLayer:', beginCheckoutData);
  window.dataLayer.push(beginCheckoutData);

  // 2) Pixel del navegador (para deduplicación con CAPI)
  if (window.fbq) {
    var opts = { eventID: eid };

    // Test code opcional (mismo esquema que en PageView)
    var tc = window.fb_test_code || '{{FB_TEST_EVENT_CODE}}';
    if (tc && tc.indexOf('FB_TEST_EVENT_CODE') === -1) {
      opts.test_event_code = tc;
    }

    fbq('track', 'InitiateCheckout', { value: valueByProc, currency: 'UYU' }, opts);
    // Debug: console.log('🔔 InitiateCheckout enviado', { eventID: eid, procesadora: procNorm, alias: aliasActual, value: valueByProc });
  }
}



let alias = document.body.dataset.alias; // variable global reutilizable


// BOTONES SIMPLES (Antel / Movistar / MercadoPago landing)
document.querySelectorAll('.btn-procesadora').forEach(btn => {
  btn.addEventListener('click', function () {
    const procAttr = btn.dataset.procesadora; // 'antel' | 'movistar' | 'mercado_pago'
    let href = "";

    if (procAttr === "antel") {
      href = "sms:6464?body=" + encodeURIComponent((alias || 'celeste').toUpperCase());
    } else if (procAttr === "movistar") {
      href = "sms:6464?body=" + encodeURIComponent((alias || 'celeste').toUpperCase());
    } else if (procAttr === "mercado_pago") {
      href = "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=2c93808494d5e4f40194e21cd4d70771";
    }

    // 🔔 Tracking mínimo
    trackBeginCheckout(procAttr);

    // ⏩ Redirección (dejá tu delay)
    setTimeout(() => { window.location.href = href; }, 600);
  });
});

document.querySelectorAll('.auto-clickeable').forEach(btn => {
  btn.addEventListener('click', function (e) {
    e.preventDefault();

    // Normalizamos este caso como "antel" para analytics
    const href = "sms:6464?body=" + encodeURIComponent((alias || 'celeste').toUpperCase());
    trackBeginCheckout('imagen_principal_landing');

    setTimeout(() => { window.location.href = href; }, 600);
  });
});



  // BOTÓN GENERAL DE SUSCRIPCIÓN
  const btnSuscribite = document.getElementById('boton-suscribite');
  const modalSuscripcion = document.getElementById('modal-suscripcion');
  const cerrarModal = document.getElementById('cerrar-modal');
  const noMobileMsg = document.getElementById('no-mobile-msg');
  const equipoItems = document.querySelectorAll('.equipo-item');
  const planCards = document.querySelectorAll('.plan-card');

  function isMobileDevice() {
    return /android|iphone|ipad|ipod|windows phone/i.test(navigator.userAgent);
  }

  if (btnSuscribite && modalSuscripcion && cerrarModal) {
    btnSuscribite.onclick = () => {
      modalSuscripcion.style.display = 'flex';
      if (noMobileMsg) noMobileMsg.style.display = 'none';
    };
    cerrarModal.onclick = () => modalSuscripcion.style.display = 'none';
    window.addEventListener('click', (e) => {
      if (e.target === modalSuscripcion) modalSuscripcion.style.display = "none";
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalSuscripcion.style.display === 'flex') {
        modalSuscripcion.style.display = 'none';
      }
    });
  }


// SMS dentro del modal
equipoItems.forEach(item => {
  item.addEventListener('click', function () {
    alias = this.getAttribute('data-mensaje').toLowerCase(); // solo para armar el SMS

    // 🔔 Tracking mínimo con rótulo "sms"
    trackBeginCheckout('sms');

    if (isMobileDevice()) {
      window.location.href = `sms:6464?body=${encodeURIComponent(alias)}`;
    } else {
      if (noMobileMsg) {
        noMobileMsg.innerHTML = `<p>Ups, tenés que estar en tu celular para suscribirte por SMS<br>Intentá con Mercado Pago:</p>`;
        noMobileMsg.style.display = 'block';
      }
    }
  });
});


  // FAQ - Expandir respuestas
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (item) item.classList.toggle('open');
    });
  });


// MercadoPago dentro del modal
planCards.forEach(item => {
  item.addEventListener('click', function () {
    const msg = this.getAttribute('data-mensaje');
    let redirectUrl = "";

    switch (msg) {
      case "MERCADOPAGO-MENSUAL":
        redirectUrl = "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=2c93808494d5e4f40194e21cd4d70771";
        break;
      case "MERCADOPAGO-TRIMESTRAL":
        redirectUrl = "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=2c93808494d5e4f10194e21f394b073e";
        break;
      case "MERCADOPAGO-ANUAL":
        redirectUrl = "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=2c93808494dc05c90194e21fbf48038b";
        break;
    }

    // 🔔 Tracking mínimo con rótulo "mercado_pago"
    trackBeginCheckout('mercado_pago');

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 600);
  });
});


  // VIDEO MODAL DESDE MINIATURAS
  const modalVideo = document.getElementById('modal-video');
  const iframe = document.getElementById('iframe-modal-video');
  const cerrar = document.getElementById('cerrar-modal-video');
  const titulo = document.getElementById('modal-video-titulo');
  const descripcion = document.getElementById('modal-video-descripcion');
  const prevBtn = document.getElementById('btn-prev-video');
  const nextBtn = document.getElementById('btn-next-video');
  const triggers = Array.from(document.querySelectorAll('.video-trigger'));
  let currentIndex = 0;

  function updateNavigationButtons() {
    // Función para extraer solo el nombre del ganador
    function extractGanadorName(altText) {
      if (!altText) return '';
      // Remover "Foto de " del inicio
      return altText.replace(/^Foto de\s+/i, '');
    }
    
    // Actualizar botón siguiente (año menor - arriba)
    if (currentIndex < triggers.length - 1) {
      const nextEl = triggers[currentIndex + 1];
      const nextMonth = nextEl.dataset.mes || 'Mes Siguiente';
      const nextGanador = extractGanadorName(nextEl.alt) || nextEl.dataset.titulo || '';
      nextBtn.setAttribute('data-month', nextMonth);
      nextBtn.setAttribute('data-ganador', nextGanador);
    } else {
      nextBtn.removeAttribute('data-month');
      nextBtn.removeAttribute('data-ganador');
    }
    
    // Actualizar botón anterior (año mayor - abajo)
    if (currentIndex > 0) {
      const prevEl = triggers[currentIndex - 1];
      const prevMonth = prevEl.dataset.mes || 'Mes Anterior';
      const prevGanador = extractGanadorName(prevEl.alt) || prevEl.dataset.titulo || '';
      prevBtn.setAttribute('data-month', prevMonth);
      prevBtn.setAttribute('data-ganador', prevGanador);
    } else {
      prevBtn.removeAttribute('data-month');
      prevBtn.removeAttribute('data-ganador');
    }
  }

  function openModal(index) {
    const el = triggers[index];
    if (!el) return;
    currentIndex = index;
    iframe.src = el.dataset.video + '?autoplay=1&modestbranding=1&controls=1&rel=0&playsinline=1';
    titulo.textContent = el.dataset.mes;
    descripcion.textContent = el.dataset.titulo;
    
    // Actualizar texto de botones de navegación
    updateNavigationButtons();
    modalVideo.style.display = 'flex';
    
    // Ocultar chat en móvil vertical
    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget && window.innerWidth <= 767) {
      chatWidget.style.display = 'none';
    }
  }

  triggers.forEach((el, i) => {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openModal(i);
    });
  });

  if (cerrar) cerrar.addEventListener('click', () => {
    modalVideo.style.display = 'none';
    iframe.src = '';
    
    // Mostrar chat nuevamente
    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget && window.innerWidth <= 767) {
      chatWidget.style.display = 'block';
    }
  });

  window.addEventListener('click', (e) => {
    if (e.target === modalVideo) {
      modalVideo.style.display = 'none';
      iframe.src = '';
      
      // Mostrar chat nuevamente
      const chatWidget = document.getElementById('chat-widget');
      if (chatWidget && window.innerWidth <= 767) {
        chatWidget.style.display = 'block';
      }
    }
  });

  if (prevBtn) prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      openModal(currentIndex - 1);
    }
  });

  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (currentIndex < triggers.length - 1) {
      openModal(currentIndex + 1);
    }
  });

  // Detectar gestos de deslizar en móvil
  let startY = 0;
  let startX = 0;
  let isSwipeDetected = false;

  modalVideo.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
    isSwipeDetected = false;
  });

  modalVideo.addEventListener('touchmove', (e) => {
    if (!isSwipeDetected) {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startY; // Cambio de signo para detectar dirección
      const diffX = Math.abs(currentX - startX);
      
      // Si el movimiento vertical es mayor que el horizontal, es un swipe vertical
      if (Math.abs(diffY) > 50 && Math.abs(diffY) > diffX) {
        isSwipeDetected = true;
        modalVideo.classList.add('swipe-detected');
        
        // Si es swipe hacia arriba (diffY negativo), cambiar al video anterior después de 2 segundos
        if (diffY < 0 && currentIndex < triggers.length - 1) {
          setTimeout(() => {
            openModal(currentIndex + 1); // Video anterior (año menor)
          }, 2000);
        }
        // Si es swipe hacia abajo (diffY positivo), cambiar al video siguiente después de 2 segundos
        else if (diffY > 0 && currentIndex > 0) {
          setTimeout(() => {
            openModal(currentIndex - 1); // Video siguiente (año mayor)
          }, 2000);
        }
        
        // Ocultar botones después de 3 segundos
        setTimeout(() => {
          modalVideo.classList.remove('swipe-detected');
        }, 3000);
      }
    }
  });

  modalVideo.addEventListener('touchend', () => {
    startY = 0;
    startX = 0;
  });

// --- CLICK EN GANADORES DEL CARRUSEL ---
const ganadorCards = document.querySelectorAll('.ganador-card');
const previewDiv = document.querySelector('.video-preview');
const nombreGanador = document.getElementById('nombre-ganador-principal');

ganadorCards.forEach(card => {
  card.addEventListener('click', () => {
    const videoId = card.dataset.video;
    const nombre = card.dataset.nombre;

    const previewDiv = document.querySelector('.video-preview');
    const nombreGanador = document.getElementById('nombre-ganador-principal');

    // Si aún no se hizo clic en la miniatura principal, cargá el iframe
    if (previewDiv && !previewDiv.querySelector('iframe')) {
      loadIframe();
    }

    if (videoId && previewDiv) {
      while (previewDiv.firstChild) previewDiv.removeChild(previewDiv.firstChild);
      const iframeEl = document.createElement('iframe');
      iframeEl.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&controls=1&rel=0`;
      iframeEl.title = 'Video del ganador';
      iframeEl.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframeEl.allowFullscreen = true;
      iframeEl.loading = 'lazy';
      iframeEl.style.width = '100%';
      iframeEl.style.height = '100%';
      iframeEl.style.border = 'none';
      previewDiv.appendChild(iframeEl);
      try {
        // Llevar la atención visual al video principal
        previewDiv.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        previewDiv.classList.add('attention');
        setTimeout(() => previewDiv.classList.remove('attention'), 1200);
      } catch (e) {}
    }

    if (nombre && nombreGanador) {
      nombreGanador.textContent = nombre;
    }
  });
});


const h1Suscribite = document.getElementById('h1-suscribite');
if (h1Suscribite) {
  h1Suscribite.addEventListener('click', () => {
    alias = document.body.dataset.alias || 'CELESTE';
    const href = "sms:6464?body=" + encodeURIComponent(alias.toUpperCase());

    // 🔔 Tracking mínimo con rótulo "h1"
    trackBeginCheckout('boton_inferior_landing');

    setTimeout(() => { window.location.href = href; }, 600);
  });
}




// --- FLECHAS DEL CARRUSEL ---
const lista = document.querySelector('.carrusel-lista');
const flechaIzq = document.querySelector('.carrusel-flecha.izq');
const flechaDer = document.querySelector('.carrusel-flecha.der');
if (lista && flechaIzq && flechaDer) {
  const card = document.querySelector('.ganador-card');
  const cardWidth = card ? card.offsetWidth + 16 : 220; // con margen
  flechaIzq.addEventListener('click', () => {
    lista.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });
  flechaDer.addEventListener('click', () => {
    lista.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });
}

// Hacer que la imagen de Mercado Pago dispare el mismo evento que la tarjeta correspondiente
const logoMP = document.querySelector('.logo-mp');
const planCardMP = document.querySelector('.plan-card[data-mensaje="MERCADOPAGO-MENSUAL"]');

if (logoMP && planCardMP) {
  logoMP.style.cursor = 'pointer'; // opcional: que se vea como clickeable
  logoMP.addEventListener('click', function () {
    planCardMP.click();
  });
}



// --- Estado para la animación de la manito ---
let manitoRunning = false;
let manitoTimers = [];
let manitoNextTimer = null;
function clearManitoTimers() {
  manitoTimers.forEach(id => clearTimeout(id));
  manitoTimers = [];
}
function scheduleNextLoop(delayMs) {
  // Deshabilitado: queremos que la manito corra una sola vez por carga de página
  return;
}

function animarManito() {
  const manito = document.getElementById('manito-click');
  if (!manito) return;
  if (manitoRunning) return; // evitar solapamientos
  manitoRunning = true;
  clearManitoTimers();

  // Cancelar animaciones previas y resetear estado invisible
  try { (manito.getAnimations && manito.getAnimations()).forEach(a => a.cancel()); } catch(e) {}
  manito.style.visibility = 'hidden';
  manito.style.opacity = 0;
  manito.style.transition = 'none';
  manito.style.transform = 'translate(-50%, 0)';

  requestAnimationFrame(() => {
    const botones = [
      document.querySelector('[data-procesadora="antel"]'),
      document.querySelector('[data-procesadora="movistar"]'),
      document.querySelector('[data-procesadora="mercado_pago"]'),
    ];
    if (!botones.every(Boolean)) { manitoRunning = false; return; }

    const firstRect = botones[0].getBoundingClientRect();
    const firstTop = firstRect.top + window.scrollY;
    const firstLeft = firstRect.left + firstRect.width * 0.6;

    // Colocar junto al primer botón sin animar
    manito.style.top = `${firstTop}px`;
    manito.style.left = `${firstLeft}px`;
    manito.style.transform = 'translate(-50%, 0) translateX(120px)';

    // Forzar reflow para fijar el estado inicial
    void manito.offsetHeight;

    // Entrada con transform + fade (sin tocar left/top todavía)
    manito.style.transition = 'transform 1.2s ease, opacity 0.6s ease';
    requestAnimationFrame(() => {
      manito.style.visibility = 'visible';
      manito.style.opacity = 1;
      manito.style.transform = 'translate(-50%, 0)';
    });

    // Cuando termina la entrada, habilitar transición de left/top y programar el recorrido
    const onTransformEnd = (e) => {
      if (!/transform/i.test(e.propertyName || '')) return;
      manito.removeEventListener('transitionend', onTransformEnd);

      // Asegurar un frame antes de activar movimiento para evitar saltos
      void manito.offsetHeight;
      // Un poquito más rápido el desplazamiento
      manito.style.transition = 'left 0.9s ease, top 0.9s ease, opacity 0.4s ease, transform 0.2s ease';

      // Tiempos base
      const MOVE_MS = 900;           // debe coincidir con la transición de left/top
      const CLICK_MS = 400;          // duración del "click" (animate)
      const NO_MOVE_CLICK_WAIT = 200;// espera cuando no hay movimiento previo
      const EXIT_BUFFER_MS = 600;    // margen extra para no cortar el último click

      const baseDelay = 200;   // antes: 1800 — dispara el primer click casi inmediato
      const step = 1350;       // un poquito más rápido entre pasos

      botones.forEach((btn, i) => {
        const t = setTimeout(() => {
          const rect = btn.getBoundingClientRect();
          const top = rect.top + window.scrollY;
          const left = rect.left + rect.width * 0.6;

          const prevTop = parseFloat(manito.style.top) || 0;
          const prevLeft = parseFloat(manito.style.left) || 0;

          manito.style.top = `${top}px`;
          manito.style.left = `${left}px`;

          const triggerClick = () => {
            try { (manito.getAnimations && manito.getAnimations()).forEach(a => a.cancel()); } catch(e) {}
            manito.animate([
              { transform: 'translate(-50%, 0) scale(1)' },
              { transform: 'translate(-50%, 3px) scale(0.9)' },
              { transform: 'translate(-50%, 0) scale(1)' }
            ], { duration: CLICK_MS, fill: 'forwards' });
          };

          if (Math.abs(prevLeft - left) < 0.5 && Math.abs(prevTop - top) < 0.5) {
            setTimeout(triggerClick, NO_MOVE_CLICK_WAIT);
          } else {
            const handler = (ev) => {
              if (ev.propertyName === 'left' || ev.propertyName === 'top') {
                manito.removeEventListener('transitionend', handler);
                triggerClick();
              }
            };
            manito.addEventListener('transitionend', handler);
          }
        }, (i === 0 ? baseDelay : baseDelay + i * step));
        manitoTimers.push(t);
      });

      // Programar salida después del último paso, con margen de seguridad
      const total = baseDelay + (botones.length - 1) * step + MOVE_MS + CLICK_MS + EXIT_BUFFER_MS;
      const tExit = setTimeout(() => {
        try { (manito.getAnimations && manito.getAnimations()).forEach(a => a.cancel()); } catch(e) {}
        manito.style.transition = 'transform 1.6s ease, opacity 0.6s ease';
        requestAnimationFrame(() => {
          manito.style.transform = 'translate(-50%, 0) translate(250vw, -250vh)';
          manito.style.opacity = 0;
        });
        const onExitEnd = (ev) => {
          // Aceptar transform o -webkit-transform por compatibilidad
          if (!/transform/i.test(ev.propertyName || '')) return;
          manito.removeEventListener('transitionend', onExitEnd);
          manito.style.visibility = 'hidden';
          manitoRunning = false; // listo para el próximo ciclo
          scheduleNextLoop(NEXT_DELAY_MS);
        };
        manito.addEventListener('transitionend', onExitEnd);
        // Fallback por si no llegara el transitionend
        const tExitGuard = setTimeout(() => {
          manito.style.visibility = 'hidden';
          manitoRunning = false;
          scheduleNextLoop(NEXT_DELAY_MS);
        }, 2400);
        manitoTimers.push(tExitGuard);
      }, total);
      manitoTimers.push(tExit);
    };
    manito.addEventListener('transitionend', onTransformEnd);
  });
}

const START_DELAY = 2800;
const NEXT_DELAY_MS = 7000; // próximo ciclo después de completar uno (más rápido)
setTimeout(() => {
  animarManito();
}, START_DELAY);



});

