/* ============================================================
   MI TAXI RIDERY — voice.js
   Motor de voz inteligente con Web Speech API
   - Escucha comandos en lenguaje natural (es-VE)
   - Consulta tarifas, claves de operación y destinos
   - Modos de respuesta A (corta) / B (larga) / C (configurable)
   - Integración con DATABASE y funciones globales de app.js
   ============================================================ */

(function () {
  'use strict';

  // ============ COMPATIBILIDAD ============
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('⚠️ Web Speech API no soportada en este navegador. El micrófono no funcionará.');
    // Desactivar botón de voz visualmente
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('btnVoice');
      if (btn) {
        btn.style.opacity = '0.4';
        btn.title = 'Voz no soportada en este navegador';
      }
    });
    return;
  }

  // ============ ESTADO DEL MÓDULO ============
  const recognition = new SpeechRecognition();
  recognition.lang = 'es-VE';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;

  let escuchando = false;
  let textoInterim = '';

  // ============ REFERENCIAS UI ============
  const btnVoice = document.getElementById('btnVoice');
  const voiceTranscript = document.getElementById('voiceTranscript');

  // ============ HELPERS ============
  // Quita tildes y pasa a minúsculas para comparar
  function normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,!?¿¡;:]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Responde por voz + transcribe en pantalla
  function responder(texto, modoVisual) {
    if (typeof window.hablar === 'function') window.hablar(texto);
    if (voiceTranscript) {
      voiceTranscript.textContent = modoVisual || texto;
    }
  }

  // Formatea una respuesta de tarifa según el modo A/B/C
  function formatearRespuestaTarifa(origen, destino, tarifa, base) {
    const modo = (window.state && window.state.modoVoz) || 'B';
    const nomBase = {
      base1: 'Base 1 Ecocenter',
      base234: 'Base Maneiro',
      base6: 'Base 6 Terranova',
      base10: 'Base 10 Nova'
    }[base] || base;

    if (tarifa == null) {
      return `Copiado. De ${origen.nombre}, clave ${origen.clave}, a ${destino.nombre}, clave ${destino.clave}. Sin tarifa registrada para ${nomBase}.`;
    }

    if (modo === 'A') {
      // Corto, estilo radio
      return `Copiado. ${origen.clave} a ${destino.clave}, ${tarifa} dólares.`;
    } else if (modo === 'C') {
      // Configurable (por defecto igual a B)
      return `De ${origen.nombre}, clave ${origen.clave}, a ${destino.nombre}, clave ${destino.clave}. Tarifa ${tarifa} dólares desde ${nomBase}.`;
    }
    // Modo B (largo, por defecto)
    return `Copiado. De ${origen.nombre}, clave ${origen.clave}, a ${destino.nombre}, clave ${destino.clave}. Son ${tarifa} dólares desde ${nomBase}.`;
  }

  // ============ PARSER DE COMANDOS ============
  // Recibe el texto reconocido y decide qué hacer
  function procesarComando(textoCrudo) {
    const t = normalizar(textoCrudo);
    if (!t) return;

    console.log('🎙️ Comando reconocido:', t);

    // ---- SALUDOS ----
    if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey)\b/.test(t)) {
      const nombre = (window.state && window.state.perfil && window.state.perfil.nombre) || 'compañero';
      responder(`Hola ${nombre}. Soy tu asistente de radio. Puedes pedirme tarifas, claves o iniciar jornada.`);
      return;
    }

    // ---- DESPEDIDAS ----
    if (/^(chao|adios|hasta luego|nos vemos|me voy)\b/.test(t)) {
      responder('Hasta pronto, buen viaje.');
      return;
    }

    // ---- AYUDA ----
    if (/^(ayuda|que puedes hacer|comandos|help)\b/.test(t)) {
      responder('Puedes decirme: tarifa de un lugar a otro, que es una clave, iniciar o terminar jornada, aceptar carrera, o cambiar de base.');
      return;
    }

    // ---- INICIAR JORNADA (código 04) ----
    if (/(iniciando|iniciar|empezar|comenzar).*(04|cuatro|jornada|turno)|iniciando mi 04/.test(t)) {
      responder('Iniciando jornada. Buen viaje, compañero.');
      const btn = document.getElementById('btnJornada');
      if (btn && (!window.state || !window.state.jornadaActiva)) btn.click();
      return;
    }

    // ---- TERMINAR JORNADA (código 05) ----
    if (/(terminando|terminar|finalizar|culminar|cerrar).*(05|cinco|jornada|turno)|terminando mi 05/.test(t)) {
      responder('Terminando jornada. Generando balance.');
      const btn = document.getElementById('btnJornada');
      if (btn && window.state && window.state.jornadaActiva) btn.click();
      else responder('No hay jornada activa para terminar.');
      return;
    }

    // ---- ACEPTAR CARRERA ----
    if (/(aceptar|confirmar|tomar).*(carrera|viaje|servicio|carrera)|aceptar carrera/.test(t)) {
      responder('Aceptando carrera.');
      const btn = document.getElementById('btnAcceptRide');
      if (btn) btn.click();
      return;
    }

    // ---- CONSULTA DE VIAJES DEL DÍA ----
    if (/(cuantos|cuanto).*(viajes|carreras).*(hoy|llevo|llevamos)|balance|resumen.*(hoy|dia)|viajes de hoy/.test(t)) {
      if (!window.state) return;
      const n = window.state.viajesHoy.length;
      const total = window.state.viajesHoy.reduce((s, v) => s + (v.tarifa || 0), 0);
      const gastos = window.state.gastosHoy.reduce((s, g) => s + (g.monto || 0), 0);
      responder(`Llevas ${n} viajes hoy. Recaudado ${total.toFixed(2)} dólares. Gastos ${gastos.toFixed(2)}. Neto ${(total - gastos).toFixed(2)}.`);
      return;
    }

    // ---- CAMBIO DE BASE ----
    const mBase = t.match(/(?:cambiar|cambiate|poner).*(base\s*?(1|2|3|4|6|10|maneiro|ecocenter|terranova|nova|sabanamar))/);
    if (mBase || /^(base|cambiar a base)\s*?(1|6|10|maneiro)/.test(t)) {
      const txt = t;
      let nuevaBase = null;
      if (/base\s?1\b|ecocenter/.test(txt)) nuevaBase = 'base1';
      else if (/maneiro|costa azul/.test(txt)) nuevaBase = 'base234';
      else if (/base\s?6\b|terranova|rio/.test(txt)) nuevaBase = 'base6';
      else if (/base\s?10\b|nova|sabanamar/.test(txt)) nuevaBase = 'base10';

      if (nuevaBase && window.state) {
        const sel = document.getElementById('selectBase');
        if (sel) {
          sel.value = nuevaBase;
          sel.dispatchEvent(new Event('change'));
        }
      }
      return;
    }

    // ---- CONSULTA DE CLAVE (¿qué es la 78? / ¿qué es 160?) ----
    // "que es la clave 78" / "que significa 160" / "que es 78"
    const mClave = t.match(/(?:que (es|significa|es la) )?(?:la )?(?:clave\s*)?(\d{1,3}|p-\d)\b/);
    if (mClave && /(?:que (es|significa)|definicion|significado)/.test(t)) {
      const claveBuscada = mClave[2];
      const resultado = DATABASE.buscarClaveOperacion(claveBuscada);
      if (resultado && resultado.descripcion) {
        responder(`Clave ${claveBuscada}: ${resultado.descripcion.toLowerCase()}.`);
      } else if (typeof resultado === 'string') {
        responder(`Clave ${claveBuscada}: ${resultado.toLowerCase()}.`);
      } else {
        // Intentar como destino
        const dest = DATABASE.destinos[claveBuscada];
        if (dest) responder(`Clave ${claveBuscada}: ${dest.nombre}.`);
        else responder(`No encontré la clave ${claveBuscada}.`);
      }
      return;
    }

    // ---- CONSULTA INVERSA DE CLAVE (¿qué clave es La Asunción?) ----
    const mInv = t.match(/(?:que clave|cual clave|clave de|clave para)\s+(.+)$/);
    if (mInv && /(?:que clave|cual clave|clave de|clave para)/.test(t)) {
      const nombreBuscado = mInv[1];
      const dest = DATABASE.buscarDestino(nombreBuscado);
      if (dest) {
        responder(`${dest.nombre} es la clave ${dest.clave}.`);
      } else {
        responder(`No encontré un destino llamado ${nombreBuscado}.`);
      }
      return;
    }

    // ---- CONSULTA DE TARIFA ----
    // Patrones: "tarifa de X a Y" / "cuanto cuesta ir a Y" / "precio de X a Y" / "de X a Y"
    let origenTexto = null, destinoTexto = null;

    // Patrón 1: "tarifa de X a Y" / "precio de X a Y" / "de X a Y"
    const mFull = t.match(/(?:tarifa|precio|costo|cuanto cuesta|cuanto vale)?\s*de\s+(.+?)\s+a\s+(.+)$/);
    if (mFull) {
      origenTexto = mFull[1];
      destinoTexto = mFull[2];
    } else {
      // Patrón 2: "cuanto cuesta ir a Y" / "tarifa a Y" / "precio a Y"
      const mSoloDest = t.match(/(?:cuanto cuesta|cuanto vale|tarifa|precio|costo)?\s*(?:ir a|viaje a|hasta|a)\s+(.+)$/);
      if (mSoloDest) {
        destinoTexto = mSoloDest[1];
        // Origen = la base activa
        const baseActiva = window.state ? window.state.baseActiva : 'base6';
        const clavesBase = {
          base1: 'B1', base234: 'B234', base6: 'B6', base10: 'B10'
        };
        origenTexto = clavesBase[baseActiva] || 'base';
      }
    }

    if (destinoTexto) {
      const destino = DATABASE.buscarDestino(destinoTexto);

      if (!destino) {
        responder(`No encontré el destino "${destinoTexto}". Prueba con otro nombre.`);
        return;
      }

      // Buscar origen si fue proporcionado
      let origen = null;
      if (origenTexto && !/^(base|b\d)/.test(origenTexto)) {
        origen = DATABASE.buscarDestino(origenTexto);
      }

      const baseActiva = window.state ? window.state.baseActiva : 'base6';
      const tarifa = DATABASE.calcularTarifa(baseActiva, destino.clave);

      // Si encontramos origen, damos info completa
      if (origen) {
        const texto = formatearRespuestaTarifa(origen, destino, tarifa, baseActiva);
        responder(texto, `📻 ${origen.nombre} (${origen.clave}) → ${destino.nombre} (${destino.clave}) · ${tarifa != null ? '$' + tarifa.toFixed(2) : 's/t'}`);
        // Actualizar trip details en pantalla
        if (window.state) {
          document.getElementById('tripOrigin').value = origen.nombre;
          document.getElementById('tripDest').value = destino.nombre;
          document.getElementById('tripFare').textContent = tarifa != null ? `$${tarifa.toFixed(2)}` : '$—';
          document.getElementById('fareAmount').textContent = tarifa != null ? `$${tarifa.toFixed(2)}` : '$0.00';
        }
      } else {
        // Solo destino desde la base activa
        if (tarifa != null) {
          responder(`A ${destino.nombre}, clave ${destino.clave}. Tarifa ${tarifa} dólares desde la base activa.`, `📻 ${destino.nombre} (${destino.clave}) · $${tarifa.toFixed(2)}`);
        } else {
          responder(`A ${destino.nombre}, clave ${destino.clave}. Sin tarifa registrada para la base activa.`, `📻 ${destino.nombre} (${destino.clave}) · s/t`);
        }
        if (window.state) {
          document.getElementById('tripDest').value = destino.nombre;
          document.getElementById('tripFare').textContent = tarifa != null ? `$${tarifa.toFixed(2)}` : '$—';
          document.getElementById('fareAmount').textContent = tarifa != null ? `$${tarifa.toFixed(2)}` : '$0.00';
        }
      }
      return;
    }

    // ---- NO ENTENDIÓ ----
    responder('No entendí. Puedes decir: tarifa de un lugar a otro, o pedir una clave.');
    if (voiceTranscript) voiceTranscript.textContent = '❓ No entendí. Toca el micrófono e intenta de nuevo.';
  }

  // ============ EVENTOS DE RECONOCIMIENTO ============
  recognition.onstart = () => {
    escuchando = true;
    if (btnVoice) btnVoice.classList.add('listening');
    if (voiceTranscript) voiceTranscript.textContent = '🎙️ Escuchando...';
    console.log('🎙️ Reconocimiento iniciado');
  };

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    textoInterim = interim;
    if (voiceTranscript && interim) {
      voiceTranscript.textContent = '🎙️ ' + interim;
    }
    if (final) {
      procesarComando(final);
    }
  };

  recognition.onerror = (event) => {
    console.error('❌ Error de reconocimiento:', event.error);
    let msg = 'Error de voz.';
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      msg = 'Necesito permiso para usar el micróono. Actívalo en el navegador.';
    } else if (event.error === 'no-speech') {
      msg = 'No escuché nada. Intenta de nuevo.';
    } else if (event.error === 'network') {
      msg = 'Error de red. La voz funciona mejor con internet.';
    } else if (event.error === 'aborted') {
      return; // cancelado a propósito
    }
    if (voiceTranscript) voiceTranscript.textContent = '❌ ' + msg;
    if (window.agregarNotificacion) window.agregarNotificacion('❌ ' + msg);
  };

  recognition.onend = () => {
    escuchando = false;
    if (btnVoice) btnVoice.classList.remove('listening');
    console.log('🎙️ Reconocimiento terminado');
  };

  // ============ BOTÓN DE VOZ ============
  if (btnVoice) {
    btnVoice.addEventListener('click', () => {
      if (escuchando) {
        recognition.stop();
      } else {
        try {
          // Cancelar cualquier síntesis previa para no interferir
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
          recognition.start();
        } catch (e) {
          console.error('No se pudo iniciar reconocimiento:', e);
          if (voiceTranscript) voiceTranscript.textContent = '❌ No se pudo iniciar el micrófono.';
        }
      }
    });
  }

  // ============ EXPONER MÓDULO GLOBAL ============
  window.voiceModule = {
    iniciar: () => { try { recognition.start(); } catch (e) {} },
    detener: () => { try { recognition.stop(); } catch (e) {} },
    procesar: procesarComando,
    estaEscuchando: () => escuchando,
    setLang: (lang) => { recognition.lang = lang; }
  };

  console.log('🎙️ voice.js cargado. Web Speech API activa.');
})();
