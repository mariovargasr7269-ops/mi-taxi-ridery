/* ============================================
   MI TAXI RIDERY — Lógica principal v1.1
   ============================================ */

// ============ ESTADO GLOBAL ============
const state = {
  jornadaActiva: false,
  jornadaInicio: null,
  baseActiva: 'base6',
  cronometroInterval: null,
  vozEscuchando: false,
  viajesHoy: [],
  gastosHoy: [],
  temaActual: 'dark'
};

// ============ BASE DE DATOS DE CLAVES ============
// Claves de operación (según imagen 5)
const CLAVES_OPERACION = {
  10: 'COPIADO', 20: 'UBICACIÓN/SITIO', 25: 'UNIDAD/VEHÍCULO', 28: 'BAÑO',
  30: 'INICIO DE JORNADA', 36: 'INICIO DE JORNADA', 40: 'FIN DE JORNADA',
  50: 'CLIENTE PERSONAL', 60: 'CLIENTE/USUARIO', 70: 'SERVICIO DE CALLE',
  75: 'SERVICIO DE CENTRAL', 110: 'PASAJERO A BORDO', 120: 'HOMBRE',
  130: 'MUJER', 140: 'NOMBRE', 150: 'DISCULPA', 160: 'INTERROGATIVO',
  170: 'DEJAR SIN EFECTO', 180: 'MANTÉNGASE ALERTA', 190: 'SIN SALDO',
  78: 'LLUVIA', 79: 'PRECAUCIÓN', 80: 'TRÁFICO/CONGESTIÓN',
  82: 'EMERGENCIA', 83: 'ACCIDENTE DE TRÁNSITO', 84: 'CHOQUE',
  85: 'HERIDO', 86: 'MUERTO', 87: 'FUEGO', 89: 'SECUESTRO',
  'P-1': 'GUARDIA NACIONAL', 'P-2': 'POLICÍA NACIONAL',
  'P-3': 'POLICÍA MUNICIPAL', 'P-4': 'TRÁNSITO', 'P-5': 'CICPC',
  'P-6': 'PROTECCIÓN CIVIL', 'P-7': 'BOMBEROS',
  'C-1': 'SAMBIL', 'C-2': 'LA VELA', 'C-3': 'PARQUE COSTAZUL',
  'C-4': 'RATTAN PLAZA', 'C-5': 'CITY PLACE', 'C-6': 'LA REDOMA',
  'C-7': 'A.B.', 'C-8': 'C.C.M.', 'C-9': 'PARAÍSO CENTER',
  'C-10': 'AGUA CENTER', 'C-11': 'COSTA AZUL', 'C-12': 'BAYSIDE'
};

// Sectores clave (extracto de las imágenes)
const SECTORES = {
  '141': 'Pampatar', '143': 'Playa El Agua', '145': 'El Yaque',
  '121': 'Guacuco', '160': 'Av. 4 de mayo', '190': 'Macho Muerto',
  '191': 'Urb. Luisa Cáceres A.', '192': 'El Silguero',
  '193': 'Villas de Campomar', '194': 'Isleta 2', '195': 'Isleta Pueblo',
  '196': 'Doña Elisa', '197': 'Cocopozuelo', '198': 'Urb. Las Marites',
  '200': 'San Antonio', '201': 'Villa Charo', '202': 'Pedro Luis Briceño',
  '205': 'Urb. Pueblo Nuevo', '206': 'Urb. 28 de Mayo',
  '207': 'Villas de San Antonio', '208': 'Villa Rosa',
  '209': 'Villa Zoita', '210': 'Portal de la Laguna',
  '211': 'Sábana Grande', '212': 'Cují Viejo', '213': 'Urb. Marisal',
  '214': 'Diario La Hora', '215': 'Autopista El Valle',
  '216': 'Valle-Plaza', '217': 'Caja de Agua', '218': 'Toporo',
  '219': 'La Comarca', '220': 'Guatamare', '221': 'Udo',
  '233': 'Salamanca', '234': 'Cocheima', '235': 'Palosano',
  '236': 'Altagracia', '237': 'Atamo Sur', '238': 'Atamo Norte',
  '241': 'Sábana de Guacuco', '250': 'Guiriguire', '251': 'La Rinconada',
  '252': 'El Cardón', '253': 'Loma de Guerra', '254': 'El Tirano',
  '255': 'El Toco', '256': 'Aricagua', '257': 'Cimarron',
  '258': 'La Mira', '259': 'Playa El Agua', '260': 'Manzanillo',
  '261': 'Guayacán Norte', '262': 'Pedro González', '263': 'Altagracia',
  '264': 'Las Gamboas', '265': 'La Vecindad', '266': 'El Sábil',
  '267': 'El Maco', '268': 'Santa Ana', '269': 'El Cercado',
  '270': 'Tacarigua', '271': 'San Sebastián', '272': 'Tacarigüita',
  '273': 'El Portachuelo', '274': 'Juan Griego', '275': 'Pedregales',
  '276': 'Los Millanes', '277': 'Vizcuña', '278': 'Las Cabreras',
  '279': 'Taguanar', '280': 'La Pista', '281': 'Boquerón',
  '282': 'Los Fermines', '283': 'Fuentidueño', '284': 'Agua de Vaca',
  '285': 'Mata de Coco', '286': 'Guatacaral', '287': 'Carapacho',
  '288': 'Guacuco', '289': 'Las Barrancas', '290': 'Las Villarroeles',
  '291': 'La Guardia', '292': 'La Salineta', '293': 'Guiriguire',
  '294': 'El Pampatar', '295': 'Piedras Negras', '296': 'La Guardia del Sol',
  '297': 'La Lagunita', '298': 'Cerromar', '299': 'Mata Redonda',
  '300': 'Brisas de la Sierra', '301': 'La Encrucijada', '302': 'El Dátil',
  '303': 'Carcanapiral', '304': 'Nueva Segovia', '305': 'Valle Verde-Bloques',
  '306': 'La Capilla (Valle Verde)', '307': 'Las Marites',
  '308': 'Cotoperíz', '309': 'Los Bagres', '310': 'Las Bermúdez',
  '311': 'El Yaque', '312': 'Las Guevaras', '313': 'Brisas del Valle',
  '314': 'Las Giles', '315': 'Guayacán Sur', '316': 'Las Marvales',
  '317': 'Las Hernández', '318': 'Las Cubas', '319': 'Orinoco',
  '320': 'La Blanquilla', '321': 'Pueblo El Guamache',
  '322': 'Punta de Mangle', '323': 'Las Laras', '324': 'Los Gómez',
  '325': 'Santa María', '326': 'Laguna de Raya', '327': 'Mata Redonda',
  '328': 'Chacachacare', '329': 'La Restinga', '330': 'Urb. Maneiro',
  '331': 'La Yegua', '332': 'Guayacanito', '333': 'El Horcón',
  '334': 'El Manglillo', '335': 'Boca Chica', '336': 'Punta Arenas',
  '337': 'Boca de Pozo', '338': 'Robledal', '339': 'La Pared',
  '340': 'San Francisco de M.', '341': 'Juventud', '342': 'La Caracola',
  '343': 'Concorde', '344': 'Guacuco', '345': 'Puerto Abajo',
  '346': 'Parguito', '347': 'Constanza', '348': 'Puerto Viejo',
  '349': 'Puerto Cruz', '350': 'Zaragoza', '351': 'Caribe',
  '352': 'La Galera', '401': 'Boulevard', '402': 'Le Park',
  '403': 'Margabella', '404': 'Colibrí', '405': 'For You',
  '406': 'María Luisa', '407': 'Imperial', '408': 'Beach View Palace',
  '409': 'Howard Johnson', '147': 'Moreno', '148': 'Playa El Angel',
  '149': 'Urb. Maneiro', '150': 'Urb. Jorge Coll', '151': 'San Judas Tadeo',
  '152': 'Av. La Ayama', '153': 'Urbanismo Luisa C. A.',
  '154': 'Costa Azul', '155': 'Av. Bolívar', '156': 'Bahía del Morro',
  '157': 'La Arboleda', '158': 'Prolongación 4 de M.', '159': 'La Otra Sábana',
  '160': 'Av. 4 de Mayo', '161': 'Urb. Sabanamar', '162': 'Vista Bella',
  '163': 'Los Delfines', '164': 'Campomar', '165': 'Bella Vista',
  '166': 'Guaraguao', '167': 'Av. Santiago Mariño', '168': 'Av. Terranova',
  '169': 'Los Clavellitos', '170': 'Genovés', '171': 'Vicente Marcano',
  '172': 'Cruz Grande', '173': 'Palmarejo', '174': 'El Poblado',
  '175': 'Calle El Colegio', '176': 'Llano Adentro', '177': 'Pueblo Nuevo',
  '178': 'Fajardo', '179': 'Centro de Porlamar', '180': 'La Chacalera',
  '181': 'Conejeros', '182': 'Los Cocos Norte', '183': 'Los Cocos Sur',
  '184': 'Ciudad Cartón', '185': 'Los Olivos', '186': 'Cerro Colorado',
  '187': 'Charaima', '188': 'Los Cuarto', '189': 'El Piache',
  '190b': 'Macho Muerto'
};

// ============ SISTEMA DE VOZ ============
// Alias / sinónimos que la gente dice al hablar
const ALIAS_SECTORES = {
  'pampatar': '141', 'pampata': '141',
  'el yaque': '145', 'yaque': '145',
  'guacuco': '121', 'guacuco playa': '121',
  'playa el agua': '143', 'el agua': '143', 'agua playa': '143',
  'manzanillo': '260',
  'mata de coco': '285', 'mata coco': '285',
  'la asuncion': 'C-1', 'asuncion': 'C-1',
  '4 de mayo': '160', 'cuatro de mayo': '160', 'av 4 de mayo': '160',
  'la capilla': '306', 'valle verde': '305',
  'costa azul': 'C-11', 'c c costa azul': 'C-11',
  'sambil': 'C-1',
  'la vela': 'C-2',
  'rattan': 'C-4', 'rattan plaza': 'C-4',
  'porlamar': '179', 'centro porlamar': '179',
  'pedro gonzalez': '262', 'pedro gonzales': '262',
  'los robles': '382', 'robles': '382',
  'maneiro': '330', 'urb maneiro': '330',
  'terranova': '168', 'av terranova': '168',
  'juan griego': '274',
  'santa ana': '268',
  'la guardia': '291',
  'punta de piedras': '324',
  'los millanes': '276',
  'salamanca': '233',
  'el tirano': '254',
  'pedregales': '275'
};

// ============ DOM ============
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
  btnTheme: $('btnTheme')
};

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
  state.jornadaActiva = true;
  state.jornadaInicio = Date.now();
  ui.timerStatus.textContent = 'ACTIVA';
  ui.timerStatus.classList.add('active');
  ui.btnJornada.textContent = 'Terminando mi 40';
  ui.btnJornada.classList.add('active');
  state.cronometroInterval = setInterval(actualizarCronometro, 1000);
  actualizarCronometro();
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

  hablar(`Jornada terminada. Duró ${largo.split(':')[0]} horas con ${largo.split(':')[1]} minutos. Recaudaste ${totalRecaudado} dólares.`);

  alert(
    `📊 BALANCE DE JORNADA\n\n` +
    `⏱️ Duración: ${largo}\n` +
    `🕐 Inicio: ${new Date(state.jornadaInicio).toLocaleString()}\n` +
    `🕐 Fin: ${new Date().toLocaleString()}\n\n` +
    `🚕 Viajes: ${state.viajesHoy.length}\n` +
    `💰 Recaudado: $${totalRecaudado.toFixed(2)}\n` +
    `💸 Gastos: $${totalGastos.toFixed(2)}\n` +
    `✅ Neto: $${neto.toFixed(2)}\n\n` +
    `(En la próxima fase: km, gasolina, mapa de recorrido)`
  );

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

ui.btnJornada.addEventListener('click', () => {
  if (!state.jornadaActiva) iniciarJornada();
  else if (confirm('¿Terminar la jornada y generar el balance?')) terminarJornada();
});

// ============ BOTONES RÁPIDOS ============
document.querySelectorAll('.quick-btn[data-clave]').forEach(btn => {
  btn.addEventListener('click', () => {
    const clave = btn.dataset.clave;
    const nombre = btn.dataset.nombre;
    ui.tripDest.textContent = nombre.toUpperCase();
    const precio = calcularTarifa(clave);
    ui.fareAmount.textContent = `$${precio.toFixed(2)}`;
    ui.tripFare.textContent = `$${precio.toFixed(2)}`;
    hablar(`Destino ${nombre}, clave ${clave}, tarifa ${precio} dólares`);
  });
});

// ============ CÁLCULO DE TARIFAS ============
// Tabla simplificada por ahora (después la llenamos con TODAS las claves)
const TARIFAS = {
  base1:    { '145': 17, '121': 5,  '143': 5,  '260': 21, '285': 13, '141': 7,  '330': 12, 'C-1': 1, '160': 5, 'C-11': 0 },
  base234:  { '145': 22, '121': 5,  '143': 4,  '260': 26, '285': 18, '141': 7,  '330': 11, 'C-1': 1, '160': 5, 'C-11': 0 },
  base6:    { '145': 17, '121': 4,  '143': 4,  '260': 20, '285': 13, '141': 7,  '330': 14, 'C-1': 2, '160': 4, 'C-11': 5 },
  base10:   { '145': 18, '121': 5,  '143': 4,  '260': 22, '285': 14, '141': 7,  '330': 19, 'C-1': 2, '160': 4, 'C-11': 5 }
};

function calcularTarifa(claveDestino) {
  const base = state.baseActiva;
  return TARIFAS[base]?.[claveDestino] ?? 0;
}

// ============ ACEPTAR CARRERA ============
ui.btnAcceptRide.addEventListener('click', () => {
  const origen = ui.tripOrigin.textContent;
  const destino = ui.tripDest.textContent;
  const tarifa = parseFloat(ui.tripFare.textContent.replace('$', '')) || 0;

  state.viajesHoy.push({
    hora: new Date().toLocaleTimeString(),
    origen, destino, tarifa
  });

  // Voz mejorada (más natural)
  hablar(`Carrera aceptada. De ${origen.toLowerCase()} a ${destino.toLowerCase()}. Tarifa ${tarifa} dólares.`);

  console.log(`🚕 Viaje #${state.viajesHoy.length}:`, { origen, destino, tarifa });
});

// ============ UBICACIÓN ============
$('btnLocate').addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Tu navegador no soporta GPS');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      console.log('📍', pos.coords.latitude, pos.coords.longitude);
      hablar('Ubicación actualizada');
    },
    (err) => alert('No se pudo obtener la ubicación: ' + err.message)
  );
});

// ============ 🎤 SISTEMA DE VOZ INTELIGENTE ============
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'es-VE';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onstart = () => {
    state.vozEscuchando = true;
    ui.btnVoice.classList.add('listening');
    ui.voiceTranscript.textContent = '🎤 Escuchando...';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    ui.voiceTranscript.textContent = `👤 "${transcript}"`;
    setTimeout(() => procesarComando(transcript), 300);
  };

  recognition.onerror = (e) => {
    console.warn('Error de voz:', e.error);
    ui.voiceTranscript.textContent = `⚠️ ${e.error}`;
  };

  recognition.onend = () => {
    state.vozEscuchando = false;
    ui.btnVoice.classList.remove('listening');
    setTimeout(() => {
      if (!state.vozEscuchando && ui.voiceTranscript.textContent.startsWith('👤')) {
        ui.voiceTranscript.textContent = '';
      }
    }, 6000);
  };
}

ui.btnVoice.addEventListener('click', () => {
  if (!recognition) {
    alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome en Android o PC.');
    return;
  }
  if (state.vozEscuchando) recognition.stop();
  else try { recognition.start(); } catch(e) { console.warn(e); }
});

// ============ 🧠 PROCESADOR DE COMANDOS ============
function normalizar(texto) {
  return texto.toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[.,!?]/g, '').trim();
}

function buscarSector(texto) {
  const t = normalizar(texto);
  
  // 1. Buscar por clave exacta (número o código C-x)
  const numMatch = t.match(/\b(\d{1,3}|c-\d{1,2})\b/);
  if (numMatch) {
    const clave = numMatch[1];
    if (SECTORES[clave]) return { clave, nombre: SECTORES[clave] };
  }
  
  // 2. Buscar por alias exacto
  if (ALIAS_SECTORES[t]) {
    const clave = ALIAS_SECTORES[t];
    return { clave, nombre: SECTORES[clave] };
  }
  
  // 3. Buscar por coincidencia parcial en alias
  for (const [alias, clave] of Object.entries(ALIAS_SECTORES)) {
    if (t.includes(alias) || alias.includes(t)) {
      return { clave, nombre: SECTORES[clave] };
    }
  }
  
  // 4. Buscar en sectores por nombre
  for (const [clave, nombre] of Object.entries(SECTORES)) {
    if (normalizar(nombre).includes(t)) {
      return { clave, nombre };
    }
  }
  
  return null;
}

function procesarComando(texto) {
  const t = normalizar(texto);
  console.log('🧠 Procesando:', t);

  // ---- COMANDO 1: TARIFA DE X A Y ----
  // Ej: "central tarifa de 4 de mayo a la asunción"
  //     "cuanto es de pampatar a mata de coco"
  //     "de el yaque a guacuco"
  const matchTarifa = t.match(/(?:tarifa|cuanto|precio|cuesta)?\s*(?:de|desde|saliendo de)\s+(.+?)\s+(?:a|hacia|para)\s+(.+?)$/);

  if (matchTarifa) {
    const origen = buscarSector(matchTarifa[1]);
    const destino = buscarSector(matchTarifa[2]);
    
    if (origen && destino) {
      const precio = calcularTarifa(destino.clave);
      const respuesta = `Copiado. De ${origen.nombre} clave ${origen.clave}, a ${destino.nombre} clave ${destino.clave}. Son ${precio} dólares.`;
      responder(respuesta);
      return;
    }
    
    if (!origen && destino) {
      responder(`No identifiqué el origen. Repite, por favor.`);
      return;
    }
    if (origen && !destino) {
      responder(`No identifiqué el destino. Repite, por favor.`);
      return;
    }
  }

  // ---- COMANDO 2: QUÉ ES LA CLAVE X ----
  const matchClave = t.match(/(?:que es|que significa|clave|decodifica)\s*(?:la\s*)?(?:clave\s*)?(\d{1,3}|c-\d{1,2}|p-\d)/);
  if (matchClave) {
    const clave = matchClave[1];
    if (SECTORES[clave]) {
      responder(`Clave ${clave}, ${SECTORES[clave]}.`);
      return;
    }
    if (CLAVES_OPERACION[clave]) {
      responder(`Clave ${clave}, ${CLAVES_OPERACION[clave]}.`);
      return;
    }
    responder(`No tengo registrada la clave ${clave}.`);
    return;
  }

  // ---- COMANDO 3: TARIFA A UN DESTINO (solo destino) ----
  const matchDestino = t.match(/(?:tarifa|precio|cuanto es|cuanto cuesta)\s+(?:a|hacia|para)\s+(.+)/);
  if (matchDestino) {
    const destino = buscarSector(matchDestino[1]);
    if (destino) {
      const precio = calcularTarifa(destino.clave);
      responder(`A ${destino.nombre}, clave ${destino.clave}. Son ${precio} dólares.`);
      return;
    }
  }

  // ---- COMANDO 4: INICIAR / TERMINAR JORNADA ----
  if (t.includes('iniciando') && (t.includes('jornada') || t.includes('04') || t.includes('cero cuatro'))) {
    if (!state.jornadaActiva) iniciarJornada();
    else responder('La jornada ya está activa.');
    return;
  }

  if (t.includes('terminando') && (t.includes('jornada') || t.includes('40') || t.includes('cuatro cero'))) {
    if (state.jornadaActiva) terminarJornada();
    else responder('No hay jornada activa.');
    return;
  }

  // ---- COMANDO 5: ACEPTAR CARRERA ----
  if (t.includes('aceptar') || t.includes('acepto')) {
    ui.btnAcceptRide.click();
    return;
  }

  // ---- COMANDO 6: SALUDOS ----
  if (t.includes('hola') || t.includes('buenos dias') || t.includes('buenas')) {
    responder('Copiado, Mi Taxi Ridery al habla. ¿Qué necesita?');
    return;
  }

  // ---- NO ENTENDIDO ----
  responder('No entendí. Prueba diciendo: tarifa de cuatro de mayo a la asunción.');
}

function responder(mensaje) {
  ui.voiceTranscript.textContent = `📻 ${mensaje}`;
  hablar(mensaje);
}

// ============ 🔊 SÍNTESIS DE VOZ MEJORADA ============
let vocesDisponibles = [];
let vozElegida = null;

function cargarVoces() {
  vocesDisponibles = window.speechSynthesis.getVoices();
  // Buscar la mejor voz en español
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
  console.log('🎤 Voces cargadas:', vocesDisponibles.length, '| Elegida:', vozElegida?.name, vozElegida?.lang);
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

// ============ SELECTOR DE BASE ============
ui.selectBase.addEventListener('change', (e) => {
  state.baseActiva = e.target.value;
  const textoBase = e.target.options[e.target.selectedIndex].text;
  hablar(`Base cambiada a ${textoBase}`);
});

// ============ TEMA DÍA/NOCHE ============
ui.btnTheme.addEventListener('click', () => {
  const body = document.body;
  const actual = body.dataset.theme;
  const nuevo = actual === 'dark' ? 'light' : 'dark';
  body.dataset.theme = nuevo;
  state.temaActual = nuevo;
  ui.btnTheme.textContent = nuevo === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('tema', nuevo);
});

// Restaurar tema guardado
const temaGuardado = localStorage.getItem('tema');
if (temaGuardado) {
  document.body.dataset.theme = temaGuardado;
  ui.btnTheme.textContent = temaGuardado === 'dark' ? '🌙' : '☀️';
}

// ============ NAVEGACIÓN ============
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ============ INICIO ============
window.addEventListener('load', () => {
  console.log('🚕 Mi Taxi Ridery v1.1 iniciado');
  console.log('Base activa:', state.baseActiva);
  setTimeout(() => {
    hablar('Mi Taxi Ridery listo. Presione el micrófono para hablar.');
  }, 1000);
});