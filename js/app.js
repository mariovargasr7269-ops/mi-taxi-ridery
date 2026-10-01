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

// ============ BOTONES RÁPIDOS DINÁMICOS ============
const DEFAULT_QUICK_BUTTONS = [
  { clave: '311', icon: '🏖️' },
  { clave: '404', icon: '🏖️' },
  { clave: '259', icon: '🏖️' },
  { clave: '260', icon: '🏖️' },
  { clave: 'C-3', icon: '🏢' },
  { clave: '285', icon: '🏘️' },
  { clave: '141', icon: '🏰' },
  { clave: '149', icon: '🏘️' }
];

let quickButtons = [];
let modoEdicionBotones = false;

// Auto-asigna un icono según el nombre del destino
function iconoSegunNombre(nombre) {
  const n = nombre.toLowerCase();
  if (/playa|yaque|guacuco|agua|manzanillo|parguito|caracol|el cuesi|puerto/.test(n)) return '🏖️';
  if (/centro comercial|c\.c\.|sambil|ecommerce|supermarket|rio|nova|ecocenter/.test(n)) return '🏢';
  if (/urb\.|urbanizaci|maneiro|robles|olivos|oasis|victoria|sabanamar/.test(n)) return '🏘️';
  if (/pampatar|castillo|fortin|asuncion|santa ana|juangriego/.test(n)) return '🏰';
  if (/hospital|clinica|centro medico/.test(n)) return '🏥';
  if (/aeropuerto|terminal/.test(n)) return '✈️';
  if (/plaza|bolivar/.test(n)) return '🌳';
  return '📍';
}

function cargarQuickButtons() {
  try {
    const guardados = localStorage.getItem('quickButtons');
    if (guardados) {
      quickButtons = JSON.parse(guardados);
    } else {
      quickButtons = [...DEFAULT_QUICK_BUTTONS];
    }
  } catch (e) {
    console.warn('No se pudieron cargar quick buttons:', e);
    quickButtons = [...DEFAULT_QUICK_BUTTONS];
  }
}

function guardarQuickButtons() {
  try {
    localStorage.setItem('quickButtons', JSON.stringify(quickButtons));
  } catch (e) {
    console.warn('No se pudieron guardar quick buttons:', e);
  }
}

function renderQuickButtons() {
  const cont = document.getElementById('quickButtons');
  if (!cont) return;
  cont.innerHTML = '';

  quickButtons.forEach((qb, idx) => {
    const destino = DATABASE.destinos[qb.clave];
    const nombre = destino?.nombre || qb.clave;
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.dataset.clave = qb.clave;
    btn.dataset.index = idx;
    // Color de borde por zona (cíclico)
    const zonas = ['zone-a', 'zone-b', 'zone-c', 'zone-d', 'zone-e', 'zone-f', 'zone-g', 'zone-h'];
    btn.classList.add(zonas[idx % zonas.length]);
    if (modoEdicionBotones) btn.classList.add('editing');
    btn.innerHTML = `
      <span class="qb-remove">✕</span>
      <span class="qb-icon">${qb.icon || iconoSegunNombre(nombre)}</span>
      <span class="qb-name">${nombre.length > 14 ? nombre.slice(0, 13) + '…' : nombre}</span>
      <span class="qb-clave">${qb.clave}</span>
    `;
    cont.appendChild(btn);
  });

  // Botón "+" al final
  const addBtn = document.createElement('button');
  addBtn.className = 'quick-btn add-btn';
  addBtn.id = 'btnAddZone';
  addBtn.innerHTML = `
    <span class="qb-icon">➕</span>
    <span class="qb-name">Añadir</span>
  `;
  cont.appendChild(addBtn);
}

// Click en botón rápido (delegación de eventos)
document.getElementById('quickButtons').addEventListener('click', (e) => {
  const btn = e.target.closest('.quick-btn');
  if (!btn) return;

  // Si es el botón de añadir
  if (btn.id === 'btnAddZone') {
    abrirModalAddZone();
    return;
  }

  // Si está en modo edición y se tocó el botón de quitar
  if (modoEdicionBotones && e.target.closest('.qb-remove')) {
    const idx = parseInt(btn.dataset.index, 10);
    if (!isNaN(idx)) {
      const removida = quickButtons[idx];
      quickButtons.splice(idx, 1);
      guardarQuickButtons();
      renderQuickButtons();
      agregarNotificacion(`🗑️ Quitaste ${removida ? (DATABASE.destinos[removida.clave]?.nombre || removida.clave) : 'un destino'}`);
      hablar('Destino quitado de tus botones rápidos.');
    }
    return;
  }

  // Si está en modo edición, salir del modo al tocar un botón normal
  if (modoEdicionBotones) {
    modoEdicionBotones = false;
    renderQuickButtons();
    return;
  }

  // Comportamiento normal: seleccionar destino
  const clave = btn.dataset.clave;
  const destino = DATABASE.destinos[clave];
  const nombreFinal = destino?.nombre || clave;
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

// Pulsación larga para entrar en modo edición
let pressTimer = null;
document.getElementById('quickButtons').addEventListener('touchstart', (e) => {
  const btn = e.target.closest('.quick-btn');
  if (!btn || btn.id === 'btnAddZone') return;
  pressTimer = setTimeout(() => {
    modoEdicionBotones = true;
    renderQuickButtons();
    agregarNotificacion('✏️ Modo edición: toca ✕ para quitar. Toca un destino para salir.');
    if (navigator.vibrate) navigator.vibrate(50);
  }, 700);
});
document.getElementById('quickButtons').addEventListener('touchend', () => {
  if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
});
document.getElementById('quickButtons').addEventListener('touchmove', () => {
  if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
});

// ============ MODAL AÑADIR ZONA ============
function abrirModalAddZone() {
  const input = $('inputBuscarZona');
  input.value = '';
  renderResultadosBusquedaZona('');
  abrirModal('modalAddZone');
  setTimeout(() => input.focus(), 100);
}

$('inputBuscarZona').addEventListener('input', (e) => {
  renderResultadosBusquedaZona(e.target.value);
});

function renderResultadosBusquedaZona(query) {
  const cont = $('zoneSearchResults');
  const q = (query || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (!q) {
    cont.innerHTML = '<p class="modal-empty">Escribe para buscar entre los 189 destinos</p>';
    return;
  }

  const resultados = [];
  for (const [clave, info] of Object.entries(DATABASE.destinos)) {
    const nombreNorm = DATABASE.normalizar(info.nombre);
    const aliasNorm = (info.alias || []).map(a => DATABASE.normalizar(a));
    if (nombreNorm.includes(q) || aliasNorm.some(a => a.includes(q)) || clave.includes(q)) {
      resultados.push({ clave, ...info });
    }
    if (resultados.length >= 20) break;
  }

  if (resultados.length === 0) {
    cont.innerHTML = '<p class="modal-empty">No se encontraron destinos</p>';
    return;
  }

  cont.innerHTML = resultados.map(r => `
    <div class="zone-result-item" data-clave="${r.clave}">
      <div>
        <div class="zone-result-name">${r.nombre}</div>
        <div class="zone-result-meta">
          <span class="zone-result-clave">${r.clave}</span>
          <span class="zone-result-municipio">${r.municipio || ''}</span>
        </div>
      </div>
      <span style="font-size:18px">${iconoSegunNombre(r.nombre)}</span>
    </div>
  `).join('');

  // Listener para cada resultado
  cont.querySelectorAll('.zone-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const clave = item.dataset.clave;
      agregarDestinoRapido(clave);
    });
  });
}

function agregarDestinoRapido(clave) {
  if (quickButtons.some(qb => qb.clave === clave)) {
    agregarNotificacion('⚠️ Ese destino ya está en tus botones rápidos');
    return;
  }
  if (quickButtons.length >= 12) {
    agregarNotificacion('⚠️ Máximo 12 destinos rápidos. Quita uno primero (mantén presionado).');
    return;
  }
  const destino = DATABASE.destinos[clave];
  if (!destino) {
    agregarNotificacion('❌ Destino no encontrado');
    return;
  }
  quickButtons.push({ clave, icon: iconoSegunNombre(destino.nombre) });
  guardarQuickButtons();
  renderQuickButtons();
  cerrarModal('modalAddZone');
  agregarNotificacion(`✅ Añadido: ${destino.nombre} (${clave})`);
  hablar(`Añadido ${destino.nombre} a tus botones rápidos.`);
}

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

// ============ ACERCA DE / COLABORAR ============
$('btnAbout')?.addEventListener('click', () => {
  abrirModal('modalAbout');
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
  if (navigator.vibrate) navigator.vibrate(30);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      // Usar centrarSinZoom: solo desplaza el mapa, NO agranda el zoom
      if (window.mapaModule?.centrarSinZoom) {
        window.mapaModule.centrarSinZoom(latitude, longitude);
      }
      agregarNotificacion('📍 Ubicación actualizada');
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
  cargarQuickButtons();
  renderQuickButtons();
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