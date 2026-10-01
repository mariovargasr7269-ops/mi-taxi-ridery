/* ============================================================
   MI TAXI RIDERY — mapa.js
   GPS y mapa con Leaflet + OpenStreetMap
   - Centrado en Isla de Margarita
   - Marcador del taxista con pulso animado
   - Seguimiento de posición (watchPosition)
   - Trazado de recorrido (polyline) durante jornada
   - Marcador de destino seleccionable
   - Expone window.mapaModule para integración con app.js
   ============================================================ */

(function () {
  'use strict';

  // ============ CENTRO DE MARGARITA (La Asunción) ============
  const CENTRO_MARGARITA = [11.0228, -63.8626];
  const ZOOM_INICIAL = 11;

  // ============ ESTADO DEL MÓDULO ============
  let mapa = null;
  let markerDriver = null;
  let markerDestino = null;
  let polylineRecorrido = null;
  let watchId = null;
  let puntosRecorrido = [];
  let ultimaPosicion = null;

  // Icono personalizado del taxista (emoji 🚕)
  const iconoTaxi = L.divIcon({
    className: 'mapa-taxi-marker',
    html: '<div class="taxi-pulse"></div><div class="taxi-emoji">🚕</div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  // Icono del destino (emoji 📍)
  const iconoDestino = L.divIcon({
    className: 'mapa-destino-marker',
    html: '<div class="dest-emoji">📍</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  // ============ INICIALIZAR MAPA ============
  function init() {
    const container = document.getElementById('mapContainer');
    if (!container) {
      console.warn('🗺️ No se encontró #mapContainer');
      return;
    }
    if (typeof L === 'undefined') {
      console.warn('🗺️ Leaflet no está cargado. Verifica el CDN en index.html.');
      return;
    }

    mapa = L.map(container, {
      center: CENTRO_MARGARITA,
      zoom: ZOOM_INICIAL,
      zoomControl: false,
      attributionControl: true
    });

    // Capa de tiles OpenStreetMap (gratis, sin API key)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(mapa);

    // Marcador inicial del taxista en el centro
    markerDriver = L.marker(CENTRO_MARGARITA, { icon: iconoTaxi }).addTo(mapa);
    markerDriver.bindPopup('🚕 Mi ubicación');

    // Polyline para el recorrido
    polylineRecorrido = L.polyline([], {
      color: '#5eead4',
      weight: 4,
      opacity: 0.7,
      dashArray: '6 8'
    }).addTo(mapa);

    // Iniciar seguimiento de GPS automático
    iniciarSeguimiento();

    // Fix: Leaflet a veces no calcula bien el tamaño al inicio
    setTimeout(() => { if (mapa) mapa.invalidateSize(); }, 300);

    console.log('🗺️ mapa.js cargado. Mapa centrado en Margarita.');
  }

  // ============ SEGUIMIENTO DE GPS ============
  function iniciarSeguimiento() {
    if (!navigator.geolocation) {
      console.warn('🗺️ GPS no soportado en este navegador.');
      return;
    }
    if (watchId !== null) return;

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        ultimaPosicion = { lat: latitude, lng: longitude };
        actualizarUbicacion(latitude, longitude);
      },
      (err) => {
        console.warn('🗺️ Error GPS:', err.message);
        // No molestar al usuario con alertas constantes
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }

  function detenerSeguimiento() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  // ============ ACTUALIZAR UBICACIÓN ============
  function actualizarUbicacion(lat, lng) {
    if (!mapa || !markerDriver) return;
    const latlng = [lat, lng];
    markerDriver.setLatLng(latlng);

    // Si la jornada está activa, agregar punto al recorrido
    if (window.state && window.state.jornadaActiva) {
      // Solo agregar si estamos a más de 10m del último punto (evita spam)
      if (puntosRecorrido.length === 0 || distanciaMetros(puntosRecorrido[puntosRecorrido.length - 1], latlng) > 10) {
        puntosRecorrido.push(latlng);
        polylineRecorrido.setLatLngs(puntosRecorrido);
      }
    }
  }

  // Distancia entre dos puntos [lat,lng] en metros (fórmula Haversine simplificada)
  function distanciaMetros(a, b) {
    const R = 6371000;
    const dLat = (b[0] - a[0]) * Math.PI / 180;
    const dLng = (b[1] - a[1]) * Math.PI / 180;
    const lat1 = a[0] * Math.PI / 180;
    const lat2 = b[0] * Math.PI / 180;
    const x = dLat * dLat + Math.cos(lat1) * Math.cos(lat2) * dLng * dLng;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
  }

  // ============ CENTRAR EN UNA POSICIÓN (con zoom) ============
  function centrarEn(lat, lng, zoom) {
    if (!mapa) return;
    mapa.setView([lat, lng], zoom || 16, { animate: true });
    if (markerDriver) markerDriver.setLatLng([lat, lng]);
  }

  // ============ CENTRAR SIN ZOOM (solo desplaza el mapa) ============
  // Mantiene el nivel de zoom actual, solo mueve el centro
  function centrarSinZoom(lat, lng) {
    if (!mapa) return;
    const zoomActual = mapa.getZoom();
    mapa.panTo([lat, lng], { animate: true, duration: 0.8 });
    if (markerDriver) markerDriver.setLatLng([lat, lng]);
    ultimaPosicion = { lat, lng };
    return zoomActual;
  }

  // ============ CENTRAR EN UBICACIÓN ACTUAL (sin zoom) ============
  function centrarEnMiUbicacion() {
    if (ultimaPosicion) {
      // Sin zoom: solo desplaza el mapa al carro
      centrarSinZoom(ultimaPosicion.lat, ultimaPosicion.lng);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => centrarSinZoom(pos.coords.latitude, pos.coords.longitude),
        () => {
          if (window.agregarNotificacion) window.agregarNotificacion('❌ No se pudo obtener tu ubicación');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }

  // ============ MARCAR DESTINO ============
  function marcarDestino(lat, lng, nombre) {
    if (!mapa) return;
    if (markerDestino) {
      markerDestino.setLatLng([lat, lng]);
      if (nombre) markerDestino.bindPopup(`📍 ${nombre}`).openPopup();
    } else {
      markerDestino = L.marker([lat, lng], { icon: iconoDestino }).addTo(mapa);
      if (nombre) markerDestino.bindPopup(`📍 ${nombre}`);
    }
  }

  // ============ LIMPIAR DESTINO ============
  function limpiarDestino() {
    if (markerDestino) {
      mapa.removeLayer(markerDestino);
      markerDestino = null;
    }
  }

  // ============ INICIAR / DETENER RECORRIDO ============
  function iniciarRecorrido() {
    puntosRecorrido = [];
    if (polylineRecorrido) polylineRecorrido.setLatLngs([]);
  }

  function terminarRecorrido() {
    // Devuelve los puntos para que app.js los pueda guardar en la jornada
    const puntos = puntosRecorrido.slice();
    puntosRecorrido = [];
    if (polylineRecorrido) polylineRecorrido.setLatLngs([]);
    return puntos;
  }

  // ============ EXPONER MÓDULO GLOBAL ============
  window.mapaModule = {
    init,
    centrarEn,
    centrarSinZoom,
    centrarEnMiUbicacion,
    marcarDestino,
    limpiarDestino,
    iniciarRecorrido,
    terminarRecorrido,
    detenerSeguimiento,
    getUltimaPosicion: () => ultimaPosicion
  };

  // ============ INICIALIZAR AL CARGAR ============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Fix de tamaño cuando la ventana cambia (orientación, etc.)
  window.addEventListener('resize', () => {
    if (mapa) setTimeout(() => mapa.invalidateSize(), 200);
  });
})();
