// En public/service-worker.js

const CACHE_NAME = 'pokepwa-cache-v1';
const urlsToCache = [
  '/', // La página principal
  '/index.html', // El HTML base
  '/manifest.json', // El manifiesto
  '/logo192.png', // Iconos por defecto de React
  '/logo512.png',
  // ¡Aquí está la magia!
  // 1. La llamada a la API que queremos guardar
  'https://pokeapi.co/api/v2/pokemon?limit=24', 
];

// 2. Generar las URLs de las 24 imágenes
for (let i = 1; i <= 24; i++) {
  urlsToCache.push(
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png`
  );
}

// Evento 'install': Se dispara cuando el Service Worker se instala
// eslint-disable-next-line no-restricted-globals
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abriendo cache y guardando archivos...');
        // addAll toma la lista de URLs y las fetchea y guarda en el cache
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Service Worker: Falló el pre-caching', err);
      })
  );
});

// Evento 'fetch': Se dispara cada vez que la app pide un recurso (API, imagen, CSS)
// eslint-disable-next-line no-restricted-globals
self.addEventListener('fetch', event => {
  // Implementamos una estrategia "Cache-First" (Primero el cache)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 1. Si el recurso SÍ está en el cache, lo devolvemos desde allí
        if (cachedResponse) {
          return cachedResponse;
        }

        // 2. Si NO está, vamos a la red a buscarlo
        return fetch(event.request).then(networkResponse => {
          // 3. (Opcional pero recomendado) Guardamos la nueva respuesta en el cache
          //    para la próxima vez. Esto es similar a lo que tu PDF sugiere
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
      .catch(error => {
        console.error('Service Worker: Error en el fetch', error);
        // Podrías devolver una página de "estás offline" aquí
      })
  );
});

// Evento 'activate': Se dispara cuando el Service Worker se activa
// Se usa para limpiar caches antiguos
// eslint-disable-next-line no-restricted-globals
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => {
          // Borramos cualquier cache que no sea el actual
          return name !== CACHE_NAME;
        }).map(name => {
          console.log('Service Worker: Borrando cache antiguo', name);
          return caches.delete(name);
        })
      );
    })
  );
});

// Se dispara cuando la app (React) envía un 'postMessage'
// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', (event) => {
  
  // Revisamos si es un tipo de notificación que conocemos
  if (event.data && event.data.pokemon) {
    const pokemon = event.data.pokemon;
    let title = "Pokédex Actualizada"; // Título por defecto
    let tag = "poke-consult"; // Tag por defecto

    // Personalizamos el título basado en el tipo de mensaje
    if (event.data.type === "SHOW_CAPTURE_NOTIFICATION") {
      title = "¡Pokémon Capturado!";
      tag = "poke-capture";
    }

    // Opciones de la notificación
    const options = {
      body: pokemon.body, // El cuerpo del mensaje vendrá desde App.js
      icon: pokemon.icon,
      vibrate: [200, 100, 200],
      tag: tag // Usamos tags diferentes para que no se sobreescriban
    };
    
    // Mostramos la notificación
    event.waitUntil(
      // eslint-disable-next-line no-restricted-globals
      self.registration.showNotification(title, options)
    );
  }
});