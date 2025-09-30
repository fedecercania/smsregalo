// Función para obtener respuestas locales del chatbot
function obtenerRespuestaLocal(pregunta) {
  const respuestas = {
    'hola': '¡Hola! 👋 ¿En qué te puedo ayudar?',
    'como funciona': 'Para participar solo necesitás suscribirte y enviar un SMS con el tema que te guste. Cada mes sorteamos $50.000 y a fin de año un Citroën C3 0km! 🚗',
    'como suscribirme': 'Hacé clic en el botón "Suscribite" y elegí tu tema favorito. Podés elegir entre MANYA, BOLSO, CELESTE, BASQUET, ROCK o FÚTBOL.',
    'premios': 'Los premios son $50.000 pesos todos los meses y un Citroën C3 0km a fin de año. ¡Cada 3 meses de suscripción tenés 1 chance extra!',
    'cuando es el sorteo': 'Los sorteos son mensuales. El ganador del mes se anuncia en nuestra página y redes sociales.',
    'como ganar': 'Para ganar solo tenés que estar suscrito y mantener tu suscripción activa. Cuanto más tiempo estés suscrito, más chances tenés.',
    'contacto': 'Podés contactarnos por WhatsApp al 092 674 777, Facebook en fb.com/smsregalos o por email.',
    'precio': 'El costo es el de un SMS normal de tu operadora. No hay costos adicionales.',
    'como cancelar': 'Para cancelar tu suscripción podés contactarnos por WhatsApp o email y te ayudamos con el proceso.',
    'ganadores': 'Podés ver todos los ganadores anteriores en la sección "Ganadores" de nuestra página.',
    'ayuda': '¡Estoy aquí para ayudarte! ¿Tenés alguna duda específica sobre nuestros sorteos o suscripciones?',
    'gracias': '¡De nada! 😊 ¿Hay algo más en lo que te pueda ayudar?',
    'adios': '¡Hasta luego! 🎉 ¡Suerte en los sorteos!',
    'que temas hay': 'Los temas disponibles son: MANYA, BOLSO, CELESTE, BASQUET, ROCK y FÚTBOL. Elegí el que más te guste.',
    'cuanto cuesta': 'Solo pagás el costo de un SMS normal de tu operadora. No hay costos adicionales ni mensualidades.',
    'es seguro': '¡Sí! Somos una empresa seria con bases legales claras. Todos nuestros sorteos son fiscalizados.',
    'donde estan las bases': 'Las bases legales están disponibles en la sección "Bases" de nuestra página.',
    'sobre nosotros': 'Somos SMS Regalos, una empresa uruguaya dedicada a hacer sorteos divertidos y transparentes. ¡Hecho con ❤️ en Uruguay!'
  };

  // Buscar respuesta exacta
  if (respuestas[pregunta]) {
    return respuestas[pregunta];
  }

  // Buscar palabras clave
  if (pregunta.includes('suscribir') || pregunta.includes('inscribir')) {
    return 'Para suscribirte hacé clic en "Suscribite" y elegí tu tema favorito. ¡Es muy fácil! 🎯';
  }
  if (pregunta.includes('premio') || pregunta.includes('ganar')) {
    return 'Los premios son $50.000 pesos mensuales y un Citroën C3 0km a fin de año. ¡Cada 3 meses tenés chance extra! 🏆';
  }
  if (pregunta.includes('sorteo') || pregunta.includes('cuando')) {
    return 'Los sorteos son mensuales. Seguinos en nuestras redes para estar al tanto de las fechas exactas. 📅';
  }
  if (pregunta.includes('costo') || pregunta.includes('precio') || pregunta.includes('pagar')) {
    return 'Solo pagás el costo de un SMS normal. No hay costos adicionales ni mensualidades. 💰';
  }
  if (pregunta.includes('contacto') || pregunta.includes('telefono') || pregunta.includes('whatsapp')) {
    return 'Podés contactarnos por WhatsApp al 092 674 777, Facebook en fb.com/smsregalos o por email. 📞';
  }
  if (pregunta.includes('tema') || pregunta.includes('temas')) {
    return 'Los temas son: MANYA, BOLSO, CELESTE, BASQUET, ROCK y FÚTBOL. ¡Elegí el que más te guste! ⚽';
  }
  if (pregunta.includes('cancelar') || pregunta.includes('baja')) {
    return 'Para cancelar tu suscripción contactanos por WhatsApp al 092 674 777 y te ayudamos. 👍';
  }
  if (pregunta.includes('seguro') || pregunta.includes('confiable')) {
    return '¡Sí! Somos una empresa seria con bases legales claras y sorteos fiscalizados. 🔒';
  }

  // Respuesta por defecto
  const respuestasDefault = [
    '¡Buena pregunta! 🤔 Podés encontrar más información en nuestra página o contactarnos por WhatsApp al 092 674 777.',
    'Para esa consulta específica te recomiendo contactarnos por WhatsApp al 092 674 777. ¡Estamos para ayudarte! 😊',
    '¡Excelente duda! 💭 Escribinos por WhatsApp al 092 674 777 y te respondemos al instante.',
    'Hmm, para eso te conviene hablarnos directamente por WhatsApp al 092 674 777. ¡Somos muy rápidos respondiendo! ⚡'
  ];
  
  return respuestasDefault[Math.floor(Math.random() * respuestasDefault.length)];
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  const header = document.getElementById("chat-header");
  const body = document.getElementById("chat-body");

header.innerHTML = `
  💬 ¿Necesitás ayuda? 
  <br>
  <span style="display: block; font-size: 0.9em; text-align: center; color: #fff9;">
    <span class="punto-verde"></span> en línea
  </span>
`;

// === Persistencia local del chat (opción A) ===
const KEY = 'chat_msgs';
const loadMsgs = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (_) { return []; }
};
const saveMsgs = (arr) => {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (_) {}
};

// Renderizar historial guardado (sin volver a persistir)
(function bootstrapChatHistory() {
  const arr = loadMsgs();
  if (!Array.isArray(arr) || !arr.length) return;
  arr.forEach(m => {
    if (!m || !m.text || !m.role) return;
    // usamos los mismos nombres de clase: 'user' | 'bot'
    const role = (m.role === 'assistant') ? 'bot' : m.role;
    const p = document.createElement("p");
    p.className = role;
    p.textContent = m.text;
    messages.appendChild(p);
  });
  messages.scrollTop = messages.scrollHeight;
})();

  // 🔁 Toggle del chat y del contenido del header
const toggleChat = () => {
  const abierto = body.style.display === "flex";
  const nuevoEstadoAbierto = !abierto;




  body.style.display = nuevoEstadoAbierto ? "flex" : "none";

  // Alternar estilo del header para quitar el "globo" rojo cuando está abierto
  if (nuevoEstadoAbierto) {
    header.classList.add('open');
  } else {
    header.classList.remove('open');
  }

  header.innerHTML = nuevoEstadoAbierto
    ? `
      <div class="chat-actions">
        <button id="chat-close-btn" type="button" class="chat-action-btn">👋 Cerrar</button>
        <button id="chat-clear-btn" type="button" class="chat-action-btn">🗑️ Borrar</button>
      </div>
    `
    : `
      💬 ¿Necesitás ayuda? 
      <br>
      <span style="display: block; font-size: 0.9em; text-align: center; color: #fff9;">
         <span class="punto-verde"></span> en línea
      </span>
    `;

  // Adjuntar handlers de los botones (si está abierto)
  if (nuevoEstadoAbierto) {
    const clearBtn = document.getElementById("chat-clear-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // evitar que el header se cierre al clickear el botón
        try { localStorage.removeItem(KEY); } catch (_) {}
        messages.innerHTML = "";
      });
    }

    const closeBtn = document.getElementById("chat-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleChat();
      });
    }

    input.focus();
  }
};


  if (header && body) {
    header.addEventListener("click", toggleChat);
  }

  // Envío del mensaje
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pregunta = input.value.trim();
      if (!pregunta) return;

      agregarMensaje("user", pregunta);
      input.value = "";
      agregarMensaje("bot", "⏳ Pensando...");

      try {
        // Simular delay de respuesta
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const thinking = messages.querySelectorAll(".bot");
        if (thinking.length) thinking[thinking.length - 1].remove();

        // Respuestas locales del chatbot
        const respuesta = obtenerRespuestaLocal(pregunta.toLowerCase());
        agregarMensaje("bot", respuesta);
      } catch (err) {
        console.error("❌ Error al procesar:", err);
        agregarMensaje("bot", "⚠️ Hubo un problema. Intentá de nuevo.");
      }
    });
  }

  function renderMensaje(remitente, texto) {
    const p = document.createElement("p");
    p.className = remitente;
    p.textContent = texto;
    messages.appendChild(p);
    messages.scrollTop = messages.scrollHeight;
  }

  function agregarMensaje(remitente, texto) {
    renderMensaje(remitente, texto);

    // Guardar en localStorage (omitimos el marcador de "pensando")
    try {
      if (!(remitente === 'bot' && String(texto).trim().startsWith('⏳'))) {
        const arr = loadMsgs();
        arr.push({ role: remitente, text: texto, ts: Date.now() });
        saveMsgs(arr.slice(-50));
      }
    } catch (_) {}
  }
});

