
// eslint-disable-next-line no-restricted-globals
self.addEventListener('fetch', event => { 
  // Revisa si la petición es para la API de Pokémon
  if (event.request.url.includes('pokeapi.co')) {
    event.respondWith(
      caches.open('poke-cache').then(cache => {
        // 1. Intenta obtener la respuesta de la red (online)
        return fetch(event.request).then(response => {
            // 2. Si la red responde, guarda la respuesta en caché y devuélvela
            cache.put(event.request, response.clone());
            return response;
          }).catch(() => {
            // 3. Si la red falla (offline), busca la respuesta en la caché
            return caches.match(event.request);
          });
      })
    );
  }
});