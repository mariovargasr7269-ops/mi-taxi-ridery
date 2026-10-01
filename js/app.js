/* ============================================================
   MI TAXI RIDERY — app.js v3.0
   ============================================================ */

// ============ ESTADO GLOBAL ============
const state = {
  jornadaActiva: false,
  jornadaInicio: null,
  baseActiva: 'base6',
  cronometroInterval: null,
  vozEscuchando: false,
  viajesHoy: [],
  gastosHoy: [],
  temaActual: 'dark',
  modoVoz: 'B', // A = corta, B = larga, C = configurable
  perfil: {
    nombre: '',
    telefono: '',
    vehiculo: '',
    avatar: '👤',
    baseHabitual: 'base6'
  },
  notificaciones: []
};

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
  btnAcceptRide: $('btnAcceptRide'),
  btnTheme: $('btnTheme'),
  btnNotifications: $('btnNotifications'),
  btnProfile: $('btnProfile'),
  avatarEmoji: $('avatarEmoji'),
  notifBadge: $('notifBadge')
};

// ============ CARGAR PERFIL Y PREFERENCIAS ============
function cargarPreferencias() {
  try {
    const perfilGuardado = localStorage.getItem('perfil');
    if (perfilGuardado) state.perfil = { ...state.perfil, ...JSON.parse(perfilGuardado) };
    
    const temaGuardado = localStorage.getItem('tema');
    if (temaGuardado) state.temaActual = temaGuardado;
    
    const baseGuardada = localStorage.getItem('baseActiva');
    if (baseGuardada) state.baseActiva = baseGuardada;
    
    const modoVozGuardado = localStorage.getItem('modoVoz');
    if (modoVozGuardado) state.modoVoz = modoVozGuardado;
  } catch (e) {
    console.warn('No se pudo cargar preferencias:', e);
  }
}

function guardarPreferencias() {
  try {
    localStorage.setItem('perfil', JSON.stringify(state.perfil));
    localStorage.setItem('tema', state.temaActual);
    localStorage.setItem('baseActiva', state.baseActiva);
    localStorage.setItem('modoVoz', state.modoVoz);
  } catch (e) {
    console.warn('No se pudo guardar:', e);
  }
}

// ============ APLICAR TEMA ============
function aplicarTema() {
  document.body.dataset.theme = state.temaActual;
  ui.btnTheme.textContent = state.temaActual === 'dark' ? '🌙' : '☀️';
}

// ============ APLICAR PERFIL ============
function aplicarPerfil() {
  if (state.perfil.nombre) {
    ui.avatarEmoji.textContent = state.perfil.avatar || '👤';
  }
}

// ============ CRONÓMETRO ============
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
  const doceHoras = 12 * 60 * 60 * 1000;
  const progreso = Math.min(ms / doceHoras, 1);
  ui.ringProgress.style.strokeDashoffset = 283 - (283 * progreso);
}

function iniciarJornada() {
  if (state.jornadaActiva) return;
  state.jornadaActiva = true;
  state.jornadaInicio = Date.now();
  state.viajesHoy = [];
  state.gastosHoy = [];
  ui.timerStatus.textContent = 'ACTIVA';
  ui.timerStatus.classList.add('active');
  ui.btnJornada.textContent = 'Terminando mi 05';
  ui.btnJornada.classList.add('active');
  state.cronometroInterval = setInterval(actualizarCronometro, 1000);
  actualizarCronometro();
  // Iniciar trazado de recorrido en el mapa
  if (window.mapaModule?.iniciarRecorrido) window.mapaModule.iniciarRecorrido();
  agregarNotificacion('🚕 Jornada iniciada. ¡Buen viaje!');
  hablar('Jornada iniciada. Buen viaje, compañero.');
}

function terminarJornada() {
  if (!state.jornadaInicio) return;
  clearInterval(state.cronometroInterval);
  const ms = Date.now() - state.jornadaInicio;
  const { largo } = formatearTiempo(ms);
  const totalRecaudado = state.viajesHoy.reduce((s, v) => s + v.tarifa, 0);
  const totalGastos = state.gastosHoy.reduce((s, g) => s + g.monto, 0);
  const neto = totalRecaudado - totalGastos;

  hablar(`Jornada terminada. Duró ${largo}. Recaudaste ${totalRecaudado} dólares.`);

  alert(
    `📊 BALANCE DE JORNADA\n\n` +
    `⏱️ Duración: ${largo}\n` +
    `🕐 Inicio: ${new Date(state.jornadaInicio).toLocaleString()}\n` +
    `🕐 Fin: ${new Date().toLocaleString()}\n\n` +
    `🚕 Viajes: ${state.viajesHoy.length}\n` +
    `💰 Recaudado: $${totalRecaudado.toFixed(2)}\n` +
    `💸 Gastos: $${totalGastos.toFixed(2)}\n` +
    `✅ Neto: $${neto.toFixed(2)}`
  );

  // Detener trazado de recorrido y guardar puntos en la jornada
  if (window.mapaModule?.terminarRecorrido) {
    const puntos = window.mapaModule.terminarRecorrido();
    if (puntos && puntos.length > 1) {
      agregarNotificacion(`🗺️ Recorrido: ${puntos.length} puntos registrados`);
    }
  }

  state.jornadaActiva = false;
  state.jornadaInicio = null;
  ui.timerStatus.textContent = 'INACTIVO';
  ui.timerStatus.classList.remove('active');
  ui.btnJornada.textContent = 'Iniciando mi 04';
  ui.btnJornada.classList.remove('active');
  ui.timerValue.textContent = '00:00';
  ui.timerFull.textContent = '00:00:00';
  ui.ringProgress.style.strokeDashoffset = 283;
}

// ============ BOTONES RÁPIDOS ============
document.querySelectorAll('.quick-btn[data-clave]').forEach(btn => {
  btn.addEventListener('click', () => {
    const clave = btn.dataset.clave;
    const nombre = btn.dataset.nombre;
    
    // Usar DATABASE para obtener el nombre canónico y precio
    const destino = DATABASE.destinos[clave];
    const nombreFinal = destino?.nombre || nombre;
    const precio = DATABASE.calcularTarifa(state.baseActiva, clave);
    
    ui.tripDest.textContent = nombreFinal.toUpperCase();
    ui.tripFare.textContent = precio != null ? `$${precio.toFixed(2)}` : '$—';
    ui.fareAmount.textContent = precio != null ? `$${precio.toFixed(2)}` : '$0.00';
    
    if (precio != null) {
      hablar(`Destino ${nombreFinal}, clave ${clave}, tarifa ${precio} dólares`);
      ui.voiceTranscript.textContent = `📻 ${nombreFinal} (${clave}) · $${precio.toFixed(2)}`;
    } else {
      hablar(`Destino ${nombreFinal}, clave ${clave}`);
      ui.voiceTranscript.textContent = `📻 ${nombreFinal} (${clave}) · Sin tarifa registrada`;
    }
  });
});

// ============ ACEPTAR CARRERA ============
ui.btnAcceptRide.addEventListener('click', () => {
  const origen = ui.tripOrigin.textContent;
  const destino = ui.tripDest.textContent;
  const tarifa = parseFloat(ui.tripFare.textContent.replace('$', '')) || 0;

  if (destino === '—') {
    agregarNotificacion('⚠️ Selecciona un destino antes de aceptar');
    hablar('Selecciona un destino primero.');
    return;
  }

  state.viajesHoy.push({
    hora: new Date().toLocaleTimeString(),
    origen, destino, tarifa
  });

  hablar(`Carrera aceptada. Destino ${destino.toLowerCase()}. Tarifa ${tarifa} dólares.`);
  agregarNotificacion(`✅ Viaje #${state.viajesHoy.length}: ${origen} → ${destino} ($${tarifa.toFixed(2)})`);
});

// ============ SELECTOR DE BASE ============
ui.selectBase.addEventListener('change', (e) => {
  state.baseActiva = e.target.value;
  guardarPreferencias();
  const textoBase = e.target.options[e.target.selectedIndex].text;
  hablar(`Base cambiada a ${textoBase}`);
  agregarNotificacion(`🏢 Base: ${textoBase}`);
});

// ============ TEMA DÍA/NOCHE ============
ui.btnTheme.addEventListener('click', () => {
  state.temaActual = state.temaActual === 'dark' ? 'light' : 'dark';
  aplicarTema();
  guardarPreferencias();
  hablar(state.temaActual === 'dark' ? 'Tema nocturno' : 'Tema diurno');
});

// ============ MODALES ============
function abrirModal(id) {
  document.getElementById(id)?.classList.add('active');
}
function cerrarModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => cerrarModal(btn.dataset.close));
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

// ============ NOTIFICACIONES ============
function agregarNotificacion(texto) {
  state.notificaciones.unshift({
    texto,
    hora: new Date().toLocaleTimeString().slice(0, 5)
  });
  if (state.notificaciones.length > 30) state.notificaciones.pop();
  actualizarNotificaciones();
}

function actualizarNotificaciones() {
  const count = state.notificaciones.length;
  ui.notifBadge.textContent = count;
  ui.notifBadge.style.display = count > 0 ? 'flex' : 'none';

  const list = $('notifList');
  if (count === 0) {
    list.innerHTML = '<p class="modal-empty">No hay notificaciones nuevas</p>';
    return;
  }
  list.innerHTML = state.notificaciones.map(n => `
    <div class="notif-item">
      <div class="notif-time">${n.hora}</div>
      <div class="notif-text">${n.texto}</div>
    </div>
  `).join('');
}

ui.btnNotifications.addEventListener('click', () => {
  actualizarNotificaciones();
  abrirModal('modalNotif');
});

// ============ PERFIL ============
function cargarPerfilEnModal() {
  $('inputNombre').value = state.perfil.nombre || '';
  $('inputTelefono').value = state.perfil.telefono || '';
  $('inputVehiculo').value = state.perfil.vehiculo || '';
  $('inputBaseHabitual').value = state.perfil.baseHabitual || 'base6';
}

ui.btnProfile.addEventListener('click', () => {
  cargarPerfilEnModal();
  abrirModal('modalProfile');
});

$('btnSaveProfile').addEventListener('click', () => {
  state.perfil.nombre = $('inputNombre').value.trim();
  state.perfil.telefono = $('inputTelefono').value.trim();
  state.perfil.vehiculo = $('inputVehiculo').value.trim();
  state.perfil.baseHabitual = $('inputBaseHabitual').value;
  state.perfil.avatar = state.perfil.nombre ? '🧑‍✈️' : '👤';
  
  guardarPreferencias();
  aplicarPerfil();
  cerrarModal('modalProfile');
  agregarNotificacion(`👤 Perfil actualizado: ${state.perfil.nombre || 'Sin nombre'}`);
  hablar(`Perfil guardado. Bienvenido ${state.perfil.nombre || 'compañero'}`);
});

// ============ JORNADA ============
ui.btnJornada.addEventListener('click', () => {
  if (!state.jornadaActiva) iniciarJornada();
  else if (confirm('¿Terminar la jornada y generar el balance?')) terminarJornada();
});

// ============ NAVEGACIÓN INFERIOR ============
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const screen = btn.dataset.screen;
    if (screen === 'trips' || screen === 'history') {
      const total = state.viajesHoy.reduce((s, v) => s + v.tarifa, 0);
      alert(`📋 Viajes de hoy: ${state.viajesHoy.length}\n💰 Total: $${total.toFixed(2)}`);
    } else if (screen === 'messages') {
      agregarNotificacion('💬 No hay mensajes nuevos');
      abrirModal('modalNotif');
    } else if (screen === 'settings') {
      abrirModal('modalProfile');
    }
  });
});

// ============ GPS ============
$('btnLocate')?.addEventListener('click', () => {
  if (!navigator.geolocation) {
    agregarNotificacion('⚠️ Tu navegador no soporta GPS');
    return;
  }
  agregarNotificacion('📍 Buscando ubicación...');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      agregarNotificacion(`📍 Ubicación: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      if (window.mapaModule?.centrarEn) {
        window.mapaModule.centrarEn(latitude, longitude);
      }
      hablar('Ubicación actualizada');
    },
    (err) => {
      agregarNotificacion('❌ Error GPS: ' + err.message);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

// ============ VOZ: SÍNTESIS MEJORADA ============
let vocesDisponibles = [];
let vozElegida = null;

function cargarVoces() {
  vocesDisponibles = window.speechSynthesis.getVoices();
  const preferencias = [
    v => v.lang === 'es-VE',
    v => v.lang === 'es-MX',
    v => v.lang === 'es-US',
    v => v.lang === 'es-ES',
    v => v.lang?.startsWith('es')
  ];
  for (const filtro of preferencias) {
    const encontrada = vocesDisponibles.find(filtro);
    if (encontrada) { vozElegida = encontrada; break; }
  }
  console.log('🎤 Voces:', vocesDisponibles.length, '| Elegida:', vozElegida?.name);
}

if ('speechSynthesis' in window) {
  cargarVoces();
  window.speechSynthesis.onvoiceschanged = cargarVoces;
}

function hablar(texto) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(texto);
  if (vozElegida) utter.voice = vozElegida;
  utter.lang = vozElegida?.lang || 'es-VE';
  utter.rate = 1.0;
  utter.pitch = 0.95;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
}

// Exponer globalmente para voice.js
window.hablar = hablar;
window.state = state;
window.agregarNotificacion = agregarNotificacion;

// ============ INICIO ============
window.addEventListener('load', () => {
  console.log('🚕 Mi Taxi Ridery v3.0 iniciado');
  cargarPreferencias();
  aplicarTema();
  aplicarPerfil();
  actualizarNotificaciones();
  
  ui.selectBase.value = state.baseActiva;
  
  // Verificar que DATABASE cargó
  if (typeof DATABASE === 'undefined') {
    console.error('❌ DATABASE no está cargada. Verifica que database.js esté ANTES de app.js en index.html');
    agregarNotificacion('❌ Error: Base de datos no cargada');
  } else {
    console.log('✅ DATABASE cargada correctamente');
    agregarNotificacion('✅ Mi Taxi Ridery listo');
  }
  
  setTimeout(() => {
    hablar('Mi Taxi Ridery listo. Presiona el micrófono para hablar.');
  }, 1200);
});