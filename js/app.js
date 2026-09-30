/* ============================================
   MI TAXI RADERY — Lógica principal (Fase demo)
   ============================================ */

// --- Estado global ---
const state = {
  jornadaActiva: false,
  jornadaInicio: null,
  baseActiva: 'base6',
  cronometroInterval: null,
  vozEscuchando: false
};

// --- Referencias DOM ---
const $ = (id) => document.getElementById(id);

const ui = {
  timerValue: $('timerValue'),
  timerFull: $('timerFull'),
  timerStatus: $('timerStatus'),
  ringProgress: $('ringProgress'),
  btnJornada: $('btnJornada'),
  btnVoice: $('btnVoice'),
  voiceTranscript: $('voiceTranscript'),
  selectBase: $('selectBase'),
  fareAmount: $('fareAmount'),
  tripOrigin: $('tripOrigin'),
  tripDest: $('tripDest'),
  tripTime: $('tripTime'),
  tripFare: $('tripFare'),
  btnAcceptRide: $('btnAcceptRide')
};

// --- Cronómetro de jornada ---
function formatearTiempo(ms) {
  const totalSeg = Math.floor(ms / 1000);
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  return {
    corto: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    largo: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  };
}

function actualizarCronometro() {
  if (!state.jornadaInicio) return;
  const ms = Date.now() - state.jornadaInicio;
  const { corto, largo } = formatearTiempo(ms);
  ui.timerValue.textContent = corto;
  ui.timerFull.textContent = largo;

  // Anillo progresivo (vuelta completa cada 12 horas)
  const doceHoras = 12 * 60 * 60 * 1000;
  const progreso = Math.min(ms / doceHoras, 1);
  const dashoffset = 283 - (283 * progreso);
  ui.ringProgress.style.strokeDashoffset = dashoffset;
}

function iniciarJornada() {
  state.jornadaActiva = true;
  state.jornadaInicio = Date.now();
  ui.timerStatus.textContent = 'ACTIVA';
  ui.timerStatus.classList.add('active');
  ui.btnJornada.textContent = 'Terminando mi 40';
  ui.btnJornada.classList.add('active');

  state.cronometroInterval = setInterval(actualizarCronometro, 1000);
  actualizarCronometro();

  hablar('Jornada iniciada. Buen viaje, compañero.');
  console.log('🚕 Jornada iniciada:', new Date().toLocaleString());
}

function terminarJornada() {
  if (!state.jornadaInicio) return;

  clearInterval(state.cronometroInterval);
  const ms = Date.now() - state.jornadaInicio;
  const { largo } = formatearTiempo(ms);

  // TODO: Aquí generaremos el balance real con los datos de la jornada
  const reporte = {
    duracion: largo,
    inicio: new Date(state.jornadaInicio).toLocaleString(),
    fin: new Date().toLocaleString(),
    viajes: 0, // se llenará después
    recaudado: 0,
    gastos: 0
  };

  console.log('📊 Balance de jornada:', reporte);
  hablar(`Jornada terminada. Duró ${largo}. Generando balance.`);

  state.jornadaActiva = false;
  state.jornadaInicio = null;
  ui.timerStatus.textContent = 'INACTIVO';
  ui.timerStatus.classList.remove('active');
  ui.btnJornada.textContent = 'Iniciando mi 04';
  ui.btnJornada.classList.remove('active');
  ui.timerValue.textContent = '00:00';
  ui.timerFull.textContent = '00:00:00';
  ui.ringProgress.style.strokeDashoffset = 283;

  alert(`📊 BALANCE DE JORNADA\n\n` +
        `⏱️ Duración: ${largo}\n` +
        `🕐 Inicio: ${reporte.inicio}\n` +
        `🕐 Fin: ${reporte.fin}\n\n` +
        `(En la próxima fase se llenará con viajes, gastos, km, gasolina, etc.)`);
}

// --- Botón de jornada ---
ui.btnJornada.addEventListener('click', () => {
  if (!state.jornadaActiva) {
    iniciarJornada();
  } else {
    if (confirm('¿Terminar la jornada y generar el balance?')) {
      terminarJornada();
    }
  }
});

// --- Botones rápidos (zonas) ---
document.querySelectorAll('.quick-btn[data-clave]').forEach(btn => {
  btn.addEventListener('click', () => {
    const clave = btn.dataset.clave;
    const nombre = btn.dataset.nombre;
    console.log(`🎯 Zona seleccionada: ${nombre} (clave ${clave})`);

    // Simulamos que es el destino
    ui.tripDest.textContent = nombre.toUpperCase();
    hablar(`Destino: ${nombre}, clave ${clave}`);
  });
});

// --- Selector de base ---
ui.selectBase.addEventListener('change', (e) => {
  state.baseActiva = e.target.value;
  console.log('🏢 Base activa:', state.baseActiva);
  hablar(`Base cambiada a ${e.target.options[e.target.selectedIndex].text}`);
});

// --- Aceptar carrera (demo) ---
ui.btnAcceptRide.addEventListener('click', () => {
  const origen = ui.tripOrigin.textContent;
  const destino = ui.tripDest.textContent;
  const tiempo = ui.tripTime.textContent;
  const tarifa = ui.tripFare.textContent;

  // Simulamos el fare
  const tarifasDemo = {
    base1: { 'MATA DE COCO': 13, 'EL YAQUE': 17, 'GUACUCO': 5, 'PLAYA EL AGUA': 5 },
    base234: { 'MATA DE COCO': 18, 'EL YAQUE': 22, 'GUACUCO': 5, 'PLAYA EL AGUA': 4 },
    base6: { 'MATA DE COCO': 13, 'EL YAQUE': 17, 'GUACUCO': 4, 'PLAYA EL AGUA': 4 },
    base10: { 'MATA DE COCO': 14, 'EL YAQUE': 18, 'GUACUCO': 5, 'PLAYA EL AGUA': 4 }
  };

  const precio = tarifasDemo[state.baseActiva]?.[destino] || 0;
  ui.fareAmount.textContent = `$${precio.toFixed(2)}`;
  ui.tripFare.textContent = `$${precio.toFixed(2)}`;

  hablar(`Carrera aceptada. De ${origen} a ${destino}. Tarifa ${precio} dólares.`);
  console.log(`🚕 Carrera: ${origen} → ${destino} · $${precio}`);
});

// --- Botón de ubicación ---
$('btnLocate').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      console.log('📍 Ubicación:', pos.coords.latitude, pos.coords.longitude);
      hablar('Ubicación actualizada');
    },
    (err) => {
      console.warn('Error GPS:', err.message);
      alert('No se pudo obtener la ubicación');
    }
  );
});

// --- Voz: reconocimiento (entrada) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'es-VE';
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    state.vozEscuchando = true;
    ui.btnVoice.classList.add('listening');
    ui.voiceTranscript.textContent = '🎤 Escuchando...';
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(r => r[0].transcript)
      .join('');
    ui.voiceTranscript.textContent = `"${transcript}"`;
  };

  recognition.onerror = (e) => {
    console.warn('Error de voz:', e.error);
    ui.voiceTranscript.textContent = `⚠️ ${e.error}`;
  };

  recognition.onend = () => {
    state.vozEscuchando = false;
    ui.btnVoice.classList.remove('listening');
    setTimeout(() => {
      if (!state.vozEscuchando) ui.voiceTranscript.textContent = '';
    }, 3000);
  };
} else {
  console.warn('Este navegador no soporta reconocimiento de voz');
}

ui.btnVoice.addEventListener('click', () => {
  if (!recognition) {
    alert('Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Safari.');
    return;
  }
  if (state.vozEscuchando) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (e) {
      console.warn(e);
    }
  }
});

// --- Voz: síntesis (salida) ---
function hablar(texto) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(texto);
  utter.lang = 'es-VE';
  utter.rate = 1.05;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}

// --- Navegación inferior ---
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    console.log('📱 Sección:', btn.dataset.screen);
  });
});

// --- Reloj y bienvenida ---
window.addEventListener('load', () => {
  console.log('🚕 Mi Taxi Radery iniciado');
  console.log('Base activa:', state.baseActiva);
});

// --- Evitar zoom accidental ---
document.addEventListener('gesturestart', (e) => e.preventDefault());