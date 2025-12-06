const CACHE_NAME = 'yxs-site-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
  // Adicione aqui outros arquivos estáticos essenciais (CSS, JS, imagens)
];

// Evento 'install': armazena os arquivos estáticos no cache
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache aberto, adicionando URLs.');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'fetch': intercepta requisições e serve do cache, se disponível
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o recurso do cache se encontrado
        if (response) {
          return response;
        }
        // Caso contrário, faz a requisição de rede
        return fetch(event.request);
      })
  );
});

// Evento 'activate': limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
