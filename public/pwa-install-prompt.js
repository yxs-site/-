// pwa-install-prompt.js
// Este arquivo captura o evento beforeinstallprompt e exibe o prompt de instalação automaticamente

let deferredPrompt;
let installPromptShown = false;

// Captura o evento beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] beforeinstallprompt event disparado');
  
  // Previne o comportamento padrão do navegador
  e.preventDefault();
  
  // Armazena o evento para uso posterior
  deferredPrompt = e;
  
  // Exibe o prompt de instalação automaticamente após um pequeno delay
  // Isso garante que a página já está totalmente carregada
  if (!installPromptShown) {
    setTimeout(() => {
      showInstallPrompt();
    }, 1000); // Aguarda 1 segundo após o carregamento
  }
});

// Função para exibir o prompt de instalação
function showInstallPrompt() {
  if (deferredPrompt && !installPromptShown) {
    console.log('[PWA] Exibindo prompt de instalação');
    deferredPrompt.prompt();
    installPromptShown = true;
    
    // Aguarda a resposta do usuário
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] Usuário aceitou a instalação');
      } else {
        console.log('[PWA] Usuário rejeitou a instalação');
      }
      
      // Limpa o evento
      deferredPrompt = null;
    });
  }
}

// Evento que dispara quando o app é instalado com sucesso
window.addEventListener('appinstalled', () => {
  console.log('[PWA] Aplicativo instalado com sucesso!');
  installPromptShown = true;
  deferredPrompt = null;
});

// Detecta se o app está sendo executado como PWA instalado
if (window.navigator.standalone === true) {
  console.log('[PWA] App está sendo executado como PWA instalado');
}
