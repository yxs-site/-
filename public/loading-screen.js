// loading-screen.js
// Controla a tela de carregamento (loading screen) do PWA

(function () {
  'use strict';

  // Referências aos elementos
  const loadingScreen = document.getElementById('loading-screen');
  const welcomeSplash = document.getElementById('welcome-splash');
  const loginScreen = document.getElementById('login-screen');

  /**
   * Esconde a tela de carregamento com transição suave
   */
  function hideLoadingScreen() {
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
  }

  /**
   * Mostra a tela de carregamento
   */
  function showLoadingScreen() {
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
    }
  }

  /**
   * Inicializa a tela de carregamento
   * Esconde após um tempo determinado ou quando a página estiver pronta
   */
  function initLoadingScreen() {
    // Aguarda o carregamento completo da página
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // Aguarda mais um pouco para garantir que tudo está carregado
        setTimeout(() => {
          hideLoadingScreen();
          // Mostra a tela de boas-vindas ou login
          if (welcomeSplash) {
            welcomeSplash.classList.add('active');
          } else if (loginScreen) {
            loginScreen.classList.add('active');
          }
        }, 2000); // 2 segundos de carregamento
      });
    } else {
      // Se o DOM já foi carregado, esconde a tela de carregamento após um delay
      setTimeout(() => {
        hideLoadingScreen();
        if (welcomeSplash) {
          welcomeSplash.classList.add('active');
        } else if (loginScreen) {
          loginScreen.classList.add('active');
        }
      }, 2000);
    }
  }

  // Inicia a tela de carregamento quando o script é carregado
  window.addEventListener('load', () => {
    // Garante que a tela de carregamento seja escondida quando a página estiver totalmente carregada
    setTimeout(() => {
      hideLoadingScreen();
    }, 2500); // Um pouco mais que o timeout anterior para garantir
  });

  // Inicia a tela de carregamento
  initLoadingScreen();

  // Expõe as funções globalmente para uso em outros scripts, se necessário
  window.loadingScreenUtils = {
    show: showLoadingScreen,
    hide: hideLoadingScreen
  };
})();
