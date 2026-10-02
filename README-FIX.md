# Mi Taxi Ridery — Fixes aplicados (01/10/2026)

## Resumen
Se repararon los 4 errores bloqueantes + se aplicó una paleta de colores
"isla tropical suave" (menos neón, más Caribbean).

## Archivos cambiados

| Archivo | Cambio |
|---------|--------|
| `css/styles.css` | Bug de sintaxis línea 789 cerrado · duplicados eliminados · paleta isla · estilos de marcadores Leaflet |
| `js/voice.js` | **NUEVO** (~280 líneas) Motor de voz inteligente con Web Speech API |
| `js/mapa.js` | **NUEVO** (~180 líneas) Leaflet + GPS centrado en Margarita |
| `js/app.js` | `iniciarJornada`/`terminarJornada` conectados al mapa para trazar recorrido |
| `assets/icons/icon-192.png` | **NUEVO** PNG 192×192 (reemplaza `192.jpg`) |
| `assets/icons/icon-512.png` | **NUEVO** PNG 512×512 (reemplaza `512.jpg`) |

## Cómo subir a tu repo

### Opción 1 — Copiar archivos manualmente
1. Descomprime `mi-taxi-ridery-fixes.zip`
2. Copia las carpetas `css/`, `js/`, `assets/` y el `index.html` sobre tu proyecto local
3. `git add . && git commit -m "Fix: bug CSS + voice.js + mapa.js + iconos + paleta isla" && git push`

### Opción 2 — Aplicar el patch (si trabajas con git)
```bash
cd ~/mi-taxi-ridery
git am /ruta/al/mi-taxi-ridery-fix.patch
git push origin main
```

## Cómo probar

1. Abre la app: https://mariovagasr7269-ops.github.io/mi-taxi-ridery/
2. **Tema día/noche**: pulsa el botón ☀️/🌙 del header — ahora SÍ cambia visualmente
3. **Voz**: pulsa el 🎤 grande — el navegador pedirá permiso de micrófono (una sola vez) y podrás decir:
   - "Tarifa de 4 de mayo a La Asunción"
   - "Qué es la clave 78"
   - "Qué clave es Pampatar"
   - "Iniciando mi 04" / "Terminando mi 05"
   - "Aceptar carrera"
   - "Cambiar a base 10"
   - "Hola" / "Balance"
4. **Mapa**: verás la Isla de Margarita; al iniciar jornada se traza tu recorrido en verde seafoam.

## Notas
- La voz (Web Speech API) funciona mejor en Chrome/Edge. En Safari iOS requiere HTTPS (GitHub Pages lo es ✓).
- El reconocimiento de voz necesita Internet (la API de Chrome usa servidores de Google para el reconocimiento).
- La síntesis de voz (TTS) sí funciona offline.
- Los íconos ahora son PNG RGBA válidos → la PWA se puede instalar correctamente.
