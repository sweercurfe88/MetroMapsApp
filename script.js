mapboxgl.accessToken = 'pk.eyJ1Ijoic29sb3lveWplaG92YSIsImEiOiJjbWsyZ3FheXcwZnE5M2ZxNHduOTBnM3c2In0.c6ZiIV6kck5DH-pY9ftlTg';
;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-100.309, 25.673],
  zoom: 11
});

const estaciones = [
  { nombre: "Talleres", lat: 25.75389, lng: -100.36528 },
  { nombre: "San Bernabé", lat: 25.74833, lng: -100.36167 },
  { nombre: "Unidad Modelo", lat: 25.74194, lng: -100.35500 },
  { nombre: "Aztlán", lat: 25.73222, lng: -100.34750 },
  { nombre: "Penitenciaría", lat: 25.72333, lng: -100.34250 },
  { nombre: "Alfonso Reyes", lat: 25.71556, lng: -100.33611 },
  { nombre: "Mitras", lat: 25.70694, lng: -100.33000 },
  { nombre: "Simón Bolívar", lat: 25.69833, lng: -100.32333 },
  { nombre: "Hospital", lat: 25.68972, lng: -100.31667 },
  { nombre: "Edison", lat: 25.68111, lng: -100.31000 },
  { nombre: "Central", lat: 25.67250, lng: -100.30333 },
  { nombre: "Cuauhtémoc", lat: 25.67300, lng: -100.30900 },
  { nombre: "Del Golfo", lat: 25.67472, lng: -100.31444 },
  { nombre: "Félix U. Gómez", lat: 25.67639, lng: -100.31972 },
  { nombre: "Parque Fundidora", lat: 25.67806, lng: -100.32500 },
  { nombre: "Y Griega", lat: 25.67972, lng: -100.33028 },
  { nombre: "Eloy Cavazos", lat: 25.68139, lng: -100.33556 },
  { nombre: "Lerdo de Tejada", lat: 25.68306, lng: -100.34083 },
  { nombre: "Exposición", lat: 25.68472, lng: -100.34611 },
  { nombre: "Sendero", lat: 25.78500, lng: -100.27833 },
  { nombre: "Tapia", lat: 25.77833, lng: -100.27333 },
  { nombre: "San Nicolás", lat: 25.77167, lng: -100.26833 },
  { nombre: "Anáhuac", lat: 25.76500, lng: -100.26333 },
  { nombre: "Universidad", lat: 25.75833, lng: -100.25833 },
  { nombre: "Niños Héroes", lat: 25.75167, lng: -100.25333 },
  { nombre: "Regina", lat: 25.74500, lng: -100.24833 },
  { nombre: "General Anaya", lat: 25.73833, lng: -100.24333 },
  { nombre: "Alameda", lat: 25.73167, lng: -100.23833 },
  { nombre: "Fundadores", lat: 25.72500, lng: -100.23333 },
  { nombre: "Padre Mier", lat: 25.71833, lng: -100.22833 },
  { nombre: "General I. Zaragoza", lat: 25.71167, lng: -100.22333 },
  { nombre: "Hospital Metropolitano", lat: 25.70500, lng: -100.21833 },
  { nombre: "Los Ángeles", lat: 25.69833, lng: -100.21333 },
  { nombre: "Ruiz Cortines", lat: 25.69167, lng: -100.20833 },
  { nombre: "Col. Moderna", lat: 25.68500, lng: -100.20333 },
  { nombre: "Metalúrgica", lat: 25.67833, lng: -100.19833 },
  { nombre: "Col. Obrera", lat: 25.67167, lng: -100.19333 },
  { nombre: "Santa Lucía", lat: 25.66500, lng: -100.18833 }
];

map.on('load', () => {
  estaciones.forEach(est => {
    new mapboxgl.Marker({ color: '#ff6600' })
      .setLngLat([est.lng, est.lat])
      .setPopup(new mapboxgl.Popup().setText(est.nombre))
      .addTo(map);
  });
});

const origenSelect = document.getElementById('origen');
const destinoSelect = document.getElementById('destino');
estaciones.forEach(est => {
  origenSelect.add(new Option(est.nombre, est.nombre));
  destinoSelect.add(new Option(est.nombre, est.nombre));
});

function calcularRuta() {
  const origenIndex = estaciones.findIndex(e => e.nombre === origenSelect.value);
  const destinoIndex = estaciones.findIndex(e => e.nombre === destinoSelect.value);
  if (origenIndex === -1 || destinoIndex === -1) return;

  // Evento personalizado en Google Analytics
  gtag('event', 'calcular_ruta', {
    event_category: 'interaccion',
    event_label: `${origenSelect.value} → ${destinoSelect.value}`
  });

  const tramo = origenIndex < destinoIndex
    ? estaciones.slice(origenIndex, destinoIndex + 1)
    : estaciones.slice(destinoIndex, origenIndex + 1).reverse();

  const coords = tramo.map(e => [e.lng, e.lat]);

  const ruta = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };
  if (map.getSource('route')) {
    map.removeLayer('route');
    map.removeSource('route');
  }
  map.addSource('route', { type: 'geojson', data: ruta });
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#ff0000', 'line-width': 4 }
  });

  // Tiempo y transbordos
  const estacionesTotales = tramo.length;
  const minutosPorEstacion = 2;
  const minutosPorTransbordo = 3;
  const puntosTransbordo = ["Cuauhtémoc", "General I. Zaragoza"];
  const transbordos = tramo.filter(e => puntosTransbordo.includes(e.nombre)).length;
  const tiempoEstimado = (estacionesTotales - 1) * minutosPorEstacion + transbordos * minutosPorTransbordo;

  document.getElementById('info').innerText =
    `Trayecto: ${estacionesTotales} estaciones — ${transbordos} transbordo(s) — Tiempo estimado: ${tiempoEstimado} minutos`;

  // Descripción narrativa dinámica
  const origenNombre = tramo[0].nombre;
  const destinoNombre = tramo[tramo.length - 1].nombre;
  const intermedias = tramo.slice(1, -1).map(e => e.nombre);

  const listadoCorto = intermedias.slice(0, 6).join(', ');
  const hayMas = intermedias.length > 6 ? `, entre otras` : '';

  let descripcion = `<h3>📍 Detalles del recorrido</h3>
    <p><b>Líneas involucradas:</b></p>
    <p>Sales de <b>${origenNombre}</b> en la línea correspondiente.</p>`;

  if (tramo.some(e => e.nombre === "Cuauhtémoc")) {
    descripcion += `<p>Transbordas en <b>Cuauhtémoc</b> hacia la Línea 2.</p>`;
  }
  if (tramo.some(e => e.nombre === "General I. Zaragoza")) {
    descripcion += `<p>Continúas hasta <b>General I. Zaragoza</b>, donde conectas con la Línea 3.</p>`;
  }

  if (intermedias.length) {
    descripcion += `<p>En el trayecto atraviesas estaciones como <b>${listadoCorto}</b>${hayMas}.</p>`;
  }

  descripcion += `<p>Finalmente llegas a <b>${destinoNombre}</b>.</p>
    <p><b>Número de estaciones:</b> ${estacionesTotales} en total.</p>
    <p><b>Tiempo promedio:</b> 1.5–2 minutos por tramo + ${minutosPorTransbordo} minutos por transbordo.</p>
    <p><b>Tiempo estimado del viaje:</b> ${tiempoEstimado} minutos.</p>`;

  document.getElementById('descripcion').innerHTML = descripcion;
}

