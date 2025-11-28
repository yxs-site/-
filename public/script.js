
/*
  script_corrected.js
  Versão corrigida e defensiva do script original enviado.
  - Todas as chamadas a elementos são feitas com checagem de existência.
  - Eventos são registrados apenas se o elemento existe.
  - Duplicações removidas.
  - Mantive a lógica original (login, registro, forgot/reset password,
    menu lateral, tema, upload de foto, modais, pull-to-refresh).
  - Deixe API_URL vazio para não enviar requests acidentalmente.
*/

(function () {
  'use strict';

  /* -----------------------
     Helpers
  ------------------------*/
  const $ = (id) => document.getElementById(id);
  const safe = (el, fn) => { if (el) fn(el); };
  const noop = () => {};

  const API_URL = ""; // manter vazio enquanto backend não configurado

  // Safe querySelectorAll that returns empty NodeList if nothing
  const $$ = (selector) => document.querySelectorAll(selector) || [];

  /* -----------------------
     Element references (de forma segura)
  ------------------------*/
  const registerScreen = $('register-screen') || null;
  const loginScreen = $('login-screen') || null;
  const forgotPasswordScreen = $('forgot-password-screen') || null;
  const resetPasswordScreen = $('reset-password-screen') || null;
  const welcomeScreen = $('welcome-screen') || null;

  const registerForm = $('register-form') || null;
  const loginForm = $('login-form') || null;
  const forgotPasswordForm = $('forgot-password-form') || null;
  const resetPasswordForm = $('reset-password-form') || null;

  const errorMessage = $('error-message') || null;
  const loginErrorMessage = $('login-error-message') || null;
  const forgotPasswordMessage = $('forgot-password-message') || null;
  const resetPasswordMessage = $('reset-password-message') || null;

  const body = document.body;

  const loginIdentifierInput = $('login-identifier') || null;
  const rememberMeCheckbox = $('remember-me') || null;

  const menuToggle = $('menu-toggle') || null;
  const sidebarMenu = $('sidebar-menu') || null;
  const closeMenu = $('close-menu') || null;
  const menuOverlay = $('menu-overlay') || null;

  const navLinks = document.querySelectorAll('.nav-link') || [];
  const pages = document.querySelectorAll('.page') || [];
  const homePage = $('home-page') || null;

  const profilePicInput = $('profile-pic-input') || null;
  const profileImg = $('profile-img') || null;

  const btnAlterarSenha = $('btn-alterar-senha') || null;
  const modalAlterarSenha = $('modal-alterar-senha') || null;
  const formAlterarSenha = $('form-alterar-senha') || null;
  const alterarSenhaMessage = $('alterar-senha-message') || null;

  const btnExcluirConta = $('btn-excluir-conta') || null;
  const modalExcluirConta = $('modal-excluir-conta') || null;
  const btnConfirmarExclusao = $('btn-confirmar-exclusao') || null;
  const btnCancelarExclusao = $('btn-cancelar-exclusao') || null;

  const themeToggle = $('theme-toggle') || null;

  /* -----------------------
     State
  ------------------------*/
  let resetToken = null;
  let currentUser = null;

  /* -----------------------
     Utilities
  ------------------------*/
  function showError(element, message) {
    if (!element) {
      // fallback: console
      console.error('showError:', message);
      return;
    }
    element.classList.remove('success-message');
    element.classList.add('error-message');
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => {
      element.classList.remove('show');
      // keep message cleared
      element.textContent = '';
    }, 5000);
  }

  function showSuccess(element, message) {
    if (!element) return;
    element.classList.remove('error-message');
    element.classList.add('success-message');
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => {
      element.classList.remove('show');
      element.textContent = '';
    }, 5000);
  }

  function updateProfileUI(user = {}) {
    const pn = $('profile-name');
    const pe = $('profile-email');
    if (pn) pn.textContent = user.username || 'Não informado';
    if (pe) pe.textContent = user.email || 'Não informado';

    const sidebarUsername = $('sidebar-username');
    if (sidebarUsername) sidebarUsername.textContent = user.username || '';
  }

  function applyTheme(theme) {
    if (!body) return;
    body.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) { }
    if (themeToggle) {
      themeToggle.classList.toggle('active', theme === 'dark');
    }
  }

  (function initTheme(){
    const saved = (() => {
      try { return localStorage.getItem('theme'); } catch (e) { return null; }
    })();
    applyTheme(saved || 'dark');
  })();

  function switchScreen(hideScreen, showScreen) {
    // hide/show with guards
    if (hideScreen && hideScreen.classList) hideScreen.classList.remove('active');
    if (showScreen && showScreen.classList) showScreen.classList.add('active');
  }

  function logout() {
    try {
      localStorage.removeItem('cardYXSUser');
      localStorage.removeItem('profileImg');
    } catch (e) {}
    currentUser = null;

    // Go to login screen if available
    if (loginScreen) {
      // if welcomeScreen exists, hide it
      switchScreen(welcomeScreen, loginScreen);
    } else {
      // hide other pages
      pages.forEach(p => p.classList.remove('active'));
      if (homePage) homePage.classList.remove('active');
    }

    // close menu safely
    if (sidebarMenu) sidebarMenu.classList.remove('active');
    if (menuOverlay) menuOverlay.classList.remove('active');
  }

  function loadProfileData() {
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem('cardYXSUser'));
    } catch (e) {
      stored = null;
    }
    if (stored && stored.token) {
      currentUser = stored;
      updateProfileUI(stored.user || {});
      const profilePictureUrl = stored.user && stored.user.profilePicture;
      if (profileImg && profilePictureUrl) {
        profileImg.src = profilePictureUrl;
        try { localStorage.setItem('profileImg', profilePictureUrl); } catch (e) {}
      } else if (profileImg && !profilePictureUrl) {
        // fallback default
        // keep existing src if present
      }

      // Show main/welcome if exists
      if (welcomeScreen && loginScreen) {
        switchScreen(loginScreen, welcomeScreen);
      }

      // Activate home page and nav
      pages.forEach(page => page.classList.remove('active'));
      if (homePage) homePage.classList.add('active');
      navLinks.forEach(l => l.classList.remove('active'));
      const navHome = $('nav-home'); if (navHome) navHome.classList.add('active');
    } else {
      // not logged
      if (welcomeScreen && loginScreen) {
        switchScreen(welcomeScreen, loginScreen);
      } else if (loginScreen) {
        switchScreen(null, loginScreen);
      }
    }
  }

  async function saveProfilePicture(base64Image) {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem('cardYXSUser'));
    } catch (e) { storedUser = null; }

    if (!storedUser || !storedUser.token) {
      console.warn('Usuário não autenticado. Não é possível salvar a foto.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedUser.token}`
        },
        body: JSON.stringify({ profilePicture: base64Image })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Erro ao salvar foto de perfil');
      }
      storedUser.user = storedUser.user || {};
      storedUser.user.profilePicture = base64Image;
      localStorage.setItem('cardYXSUser', JSON.stringify(storedUser));
      currentUser = storedUser;
      console.log('Foto atualizada no backend');
    } catch (err) {
      console.error('Erro ao salvar foto:', err.message || err);
    }
  }

  /* -----------------------
     Event registrations (safe)
  ------------------------*/
  safe(menuToggle, el => {
    el.addEventListener('click', () => {
      if (sidebarMenu) sidebarMenu.classList.add('active');
      if (menuOverlay) menuOverlay.classList.add('active');
    });
  });
  safe(closeMenu, el => {
    el.addEventListener('click', () => {
      if (sidebarMenu) sidebarMenu.classList.remove('active');
      if (menuOverlay) menuOverlay.classList.remove('active');
    });
  });
  safe(menuOverlay, el => {
    el.addEventListener('click', () => {
      if (sidebarMenu) sidebarMenu.classList.remove('active');
      menuOverlay.classList.remove('active');
    });
  });

  // nav links
  if (navLinks && navLinks.length) {
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (link.id === 'nav-sair') { logout(); return; }
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        pages.forEach(page => page.classList.remove('active'));
        const pageId = link.id.replace('nav-', '') + '-page';
        const page = document.getElementById(pageId);
        if (page) page.classList.add('active');
        if (pageId === 'home-page') {
          const navHome = $('nav-home'); if (navHome) navHome.classList.add('active');
        }
        if (sidebarMenu) sidebarMenu.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
      });
    });
  }

  // Profile picture input
  safe(profilePicInput, el => {
    el.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imgData = ev.target.result;
        if (profileImg) profileImg.src = imgData;
        try { localStorage.setItem('profileImg', imgData); } catch (ex) {}
        // try to save to backend (if configured)
        saveProfilePicture(imgData);
      };
      reader.readAsDataURL(file);
    });
  });

  // Modal alterar senha
  safe(btnAlterarSenha, el => el.addEventListener('click', () => {
    if (modalAlterarSenha) modalAlterarSenha.classList.add('active');
  }));
  // close modal generic (elements with data-modal or .modal-close)
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal');
      if (modalId && $(modalId)) $(modalId).classList.remove('active');
      else {
        // try parent modal
        const parent = btn.closest('.modal');
        if (parent) parent.classList.remove('active');
      }
    });
  });

  if (formAlterarSenha) {
    formAlterarSenha.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = ($('current-password') && $('current-password').value) || '';
      const newPassword = ($('new-password') && $('new-password').value) || '';
      const confirmNewPassword = ($('confirm-new-password') && $('confirm-new-password').value) || '';
      if (newPassword !== confirmNewPassword) {
        showError(alterarSenhaMessage, 'As novas senhas não coincidem!');
        return;
      }
      if (newPassword.length < 6) {
        showError(alterarSenhaMessage, 'A nova senha deve ter pelo menos 6 caracteres!');
        return;
      }
      const submitBtn = formAlterarSenha.querySelector("button[type='submit']");
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Alterando...'; }
      try {
        const storedUser = JSON.parse(localStorage.getItem('cardYXSUser') || 'null');
        if (!storedUser || !storedUser.token) throw new Error('Usuário não autenticado.');
        const response = await fetch(`${API_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedUser.token}`
          },
          body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword })
        });
        const data = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(data.error || 'Erro ao alterar senha.');
        showSuccess(alterarSenhaMessage, 'Senha alterada com sucesso!');
        formAlterarSenha.reset();
        setTimeout(()=> modalAlterarSenha && modalAlterarSenha.classList.remove('active'), 1500);
      } catch (err) {
        console.error('Erro ao alterar senha:', err);
        showError(alterarSenhaMessage, err.message || 'Erro ao alterar senha.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Alterar Senha'; }
      }
    });
  }

  // Modal exclusão de conta
  safe(btnExcluirConta, el => el.addEventListener('click', () => {
    if (modalExcluirConta) modalExcluirConta.classList.add('active');
  }));
  safe(btnCancelarExclusao, el => el.addEventListener('click', () => {
    if (modalExcluirConta) modalExcluirConta.classList.remove('active');
  }));
  if (btnConfirmarExclusao) {
    btnConfirmarExclusao.addEventListener('click', async () => {
      const passwordInput = $('excluir-senha');
      const excluirMessage = $('excluir-conta-message') || null;
      const password = passwordInput ? passwordInput.value : '';
      if (!password) {
        showError(excluirMessage, 'A senha é obrigatória para confirmar a exclusão.');
        return;
      }
      btnConfirmarExclusao.disabled = true;
      btnConfirmarExclusao.textContent = 'Excluindo...';
      try {
        const storedUser = JSON.parse(localStorage.getItem('cardYXSUser') || 'null');
        if (!storedUser || !storedUser.token) throw new Error('Usuário não autenticado.');
        const response = await fetch(`${API_URL}/api/auth/delete-account`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedUser.token}`
          },
          body: JSON.stringify({ password })
        });
        const data = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(data.message || 'Erro ao excluir conta.');
        showSuccess(excluirMessage, 'Conta excluída com sucesso!');
        setTimeout(()=> {
          if (modalExcluirConta) modalExcluirConta.classList.remove('active');
          logout();
        }, 1000);
      } catch (err) {
        console.error('Erro ao excluir conta:', err);
        showError($('excluir-conta-message'), err.message || 'Erro ao excluir conta.');
      } finally {
        btnConfirmarExclusao.disabled = false;
        btnConfirmarExclusao.textContent = 'Excluir Conta';
        if (passwordInput) passwordInput.value = '';
      }
    });
  }

  // Links between auth screens (safe)
  safe($('switch-to-register'), el => el.addEventListener('click', (e) => { e.preventDefault(); switchScreen(loginScreen, registerScreen); }));
  safe($('switch-to-forgot-password'), el => el.addEventListener('click', (e) => { e.preventDefault(); switchScreen(loginScreen, forgotPasswordScreen); }));
  safe($('switch-to-login'), el => el.addEventListener('click', (e) => { e.preventDefault(); switchScreen(registerScreen, loginScreen); }));
  safe($('switch-to-login-from-forgot'), el => el.addEventListener('click', (e) => { e.preventDefault(); forgotPasswordForm && forgotPasswordForm.reset(); if (forgotPasswordMessage) { forgotPasswordMessage.classList.remove('show'); forgotPasswordMessage.textContent = 'Se o e-mail existir, um link de recuperação será enviado.' } switchScreen(forgotPasswordScreen, loginScreen); }));
  safe($('switch-to-login-from-reset'), el => el.addEventListener('click', (e) => { e.preventDefault(); switchScreen(resetPasswordScreen, loginScreen); }));

  // Toggle password icons
  document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', () => {
      const targetId = icon.getAttribute('data-target');
      const targetInput = targetId ? $(targetId) : null;
      if (!targetInput) return;
      if (targetInput.type === 'password') {
        targetInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        targetInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });

  // Parse reset token from URL hash (safe)
  function parseResetURL() {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/reset-password')) {
      const questionMarkIndex = hash.indexOf('?');
      if (questionMarkIndex !== -1) {
        const queryString = hash.substring(questionMarkIndex + 1);
        const urlParams = new URLSearchParams(queryString);
        const token = urlParams.get('token');
        const email = urlParams.get('email');
        if (token && email) {
          resetToken = token;
          const resetEmailEl = $('reset-email');
          if (resetEmailEl) resetEmailEl.value = decodeURIComponent(email);
          document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
          if (resetPasswordScreen) resetPasswordScreen.classList.add('active');
          console.log('Tela de reset ativada');
          return true;
        }
      }
    }
    return false;
  }

  // Registration form submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = $('username') ? $('username').value : '';
      const email = $('email') ? $('email').value : '';
      const password = $('password') ? $('password').value : '';
      const confirmPassword = $('confirm-password') ? $('confirm-password').value : '';
      const submitBtn = registerForm.querySelector("button[type='submit']");
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Registrando...'; }
      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password, confirmPassword })
        });
        const data = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(data.error || 'Erro ao registrar usuário.');
        localStorage.setItem('cardYXSUser', JSON.stringify(data));
        currentUser = data;
        updateProfileUI(data.user || {});
        loadProfileData();
        registerForm.reset();
      } catch (err) {
        console.error('Erro no registro:', err);
        showError(errorMessage, err.message || 'Erro ao registrar. Tente novamente.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Registrar'; }
      }
    });
  }

  // Login form submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = loginIdentifierInput ? loginIdentifierInput.value : '';
      const password = $('login-password') ? $('login-password').value : '';
      const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
      const submitBtn = loginForm.querySelector("button[type='submit']");
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Entrando...'; }
      try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password, rememberMe })
        });
        const data = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(data.error || 'Erro ao fazer login.');
        localStorage.setItem('cardYXSUser', JSON.stringify(data));
        currentUser = data;
        updateProfileUI(data.user || {});
        loadProfileData();
        loginForm.reset();
      } catch (err) {
        console.error('Erro no login:', err);
        showError(loginErrorMessage, err.message || 'Erro ao fazer login. Tente novamente.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Entrar'; }
      }
    });
  }

  // Forgot password submit
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('forgot-password-email') ? $('forgot-password-email').value : '';
      const submitBtn = forgotPasswordForm.querySelector("button[type='submit']");
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando...'; }
      try {
        const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json().catch(()=>({}));
        if (!response.ok) {
          if (response.status === 404) throw new Error(data.error || 'E-mail não cadastrado.');
          throw new Error(data.error || 'Erro ao solicitar recuperação de senha.');
        }
        showSuccess(forgotPasswordMessage, 'Link de recuperação enviado! Verifique sua caixa de entrada.');
        forgotPasswordForm.reset();
      } catch (err) {
        console.error('Erro em esqueci a senha:', err);
        showError(forgotPasswordMessage, err.message || 'Erro ao solicitar recuperação de senha. Tente novamente.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enviar Link de Recuperação'; }
      }
    });
  }

  // Reset password submit
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('reset-email') ? $('reset-email').value : '';
      const newPassword = $('reset-new-password') ? $('reset-new-password').value : '';
      const confirmPassword = $('reset-confirm-password') ? $('reset-confirm-password').value : '';
      const submitBtn = resetPasswordForm.querySelector("button[type='submit']");
      if (newPassword !== confirmPassword) { showError(resetPasswordMessage, 'As senhas não coincidem!'); return; }
      if (newPassword.length < 6) { showError(resetPasswordMessage, 'A nova senha deve ter pelo menos 6 caracteres!'); return; }
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Redefinindo...'; }
      try {
        if (!resetToken) throw new Error('Token de redefinição ausente. Tente novamente a recuperação de senha.');
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, email, newPassword, confirmPassword })
        });
        const data = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(data.error || 'Erro ao redefinir senha. Token inválido ou expirado.');
        showSuccess(resetPasswordMessage, data.message || 'Senha redefinida com sucesso! Redirecionando...');
        resetPasswordForm.reset();
        setTimeout(()=> {
          switchScreen(resetPasswordScreen, loginScreen);
          if (resetPasswordMessage) resetPasswordMessage.classList.remove('show');
        }, 2000);
      } catch (err) {
        console.error('Erro ao redefinir senha:', err);
        showError(resetPasswordMessage, err.message || 'Erro ao redefinir senha. Tente novamente.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Redefinir Senha'; }
      }
    });
  }

  // Theme toggle
  safe(themeToggle, el => el.addEventListener('click', () => {
    const current = body && body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }));

  // Toggle eye icons already attached above

  // Pull to refresh: keep as-is but safe
  let pullStartY = 0, pullMoveY = 0, pullDistance = 0;
  const PULL_THRESHOLD = 100;
  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      pullStartY = e.touches[0].screenY;
    }
  });
  document.addEventListener('touchmove', (e) => {
    if (pullStartY) {
      pullMoveY = e.touches[0].screenY;
      pullDistance = pullMoveY - pullStartY;
      if (pullDistance > 0) {
        e.preventDefault();
      }
    }
  }, { passive: false });
  document.addEventListener('touchend', () => {
    if (pullDistance > PULL_THRESHOLD) window.location.reload();
    pullStartY = 0; pullMoveY = 0; pullDistance = 0;
  });

  // Hide all pages except home on load
  pages.forEach(page => {
    if (page.id !== 'home-page' && page.classList) page.classList.remove('active');
  });

  if (welcomeScreen && welcomeScreen.classList.contains('active')) {
    if (homePage) homePage.classList.add('active');
  }

  // Parse URL (reset) and check login on load
  document.addEventListener('DOMContentLoaded', () => {
    const isReset = parseResetURL();
    if (!isReset) loadProfileData();
  });

  // Export for debugging (optional)
  window.__App = {
    logout,
    loadProfileData,
    applyTheme,
  };

})();
