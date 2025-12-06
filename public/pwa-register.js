// pwa-register.js

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration.scope);
      })
      .catch(error => {
        console.log('Falha no registro do Service Worker:', error);
      });
  });
} else {
  console.log('Seu navegador não suporta Service Workers.');
}
