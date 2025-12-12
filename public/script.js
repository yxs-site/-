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

  const API_URL = ""; // URL do seu backend

  // Safe querySelectorAll that returns empty NodeList if nothing
  const $$ = (selector) => document.querySelectorAll(selector) || [];

  /* -----------------------
     Element references (de forma segura)
  ------------------------*/
  const registerScreen = $("register-screen") || null;
  const loginScreen = $("login-screen") || null;
  const forgotPasswordScreen = $("forgot-password-screen") || null;
  const resetPasswordScreen = $("reset-password-screen") || null;
  const welcomeScreen = $("welcome-screen") || null;
  const welcomeSplash = $("welcome-splash") || null;
  const btnEntrar = $("btn-entrar") || null;
  const splashMenuToggle = $("splash-menu-toggle") || null;
  const splashSidebarMenu = $("splash-sidebar-menu") || null;
  const splashCloseMenu = $("splash-close-menu") || null;
  const splashNavEntrar = $("splash-nav-entrar") || null;
  const splashNavRegistrar = $("splash-nav-registrar") || null;
  const splashNavModoClaro = $("splash-nav-modo-claro") || null;
  const splashNavModoEscuro = $("splash-nav-modo-escuro") || null;
  const loginMenuToggle = $("login-menu-toggle") || null;
  const loginSidebarMenu = $("login-sidebar-menu") || null;
  const loginCloseMenu = $("login-close-menu") || null;
  const registerMenuToggle = $("register-menu-toggle") || null;
  const registerSidebarMenu = $("register-sidebar-menu") || null;
  const registerCloseMenu = $("register-close-menu") || null;
  const forgotMenuToggle = $("forgot-menu-toggle") || null;
  const forgotSidebarMenu = $("forgot-sidebar-menu") || null;
  const forgotCloseMenu = $("forgot-close-menu") || null;
  const resetMenuToggle = $("reset-menu-toggle") || null;
  const resetSidebarMenu = $("reset-sidebar-menu") || null;
  const resetCloseMenu = $("reset-close-menu") || null;

  const registerForm = $("register-form") || null;
  const loginForm = $("login-form") || null;
  const forgotPasswordForm = $("forgot-password-form") || null;
  const resetPasswordForm = $("reset-password-form") || null;

  const errorMessage = $("error-message") || null;
  const loginErrorMessage = $("login-error-message") || null;
  const forgotPasswordMessage = $("forgot-password-message") || null;
  const resetPasswordMessage = $("reset-password-message") || null;

  const body = document.body;

  /* -----------------------
     Music Control
  ------------------------*/
  const backgroundMusic = $("background-music") || null;

  function startMusic() {
    if (!backgroundMusic) return;
    backgroundMusic.volume = 0.5; // Volume 50%
    backgroundMusic.play().catch(error => {
      console.warn("Autoplay blocked. Waiting for user interaction.", error);
    });
  }

  function stopMusic() {
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
  }

  const loginIdentifierInput = $("login-identifier") || null;
  const rememberMeCheckbox = $("remember-me") || null;

  const menuToggle = $("menu-toggle") || null;
  const sidebarMenu = $("sidebar-menu") || null;
  const closeMenu = $("close-menu") || null;
  const menuOverlay = $("menu-overlay") || null;

  const navLinks = document.querySelectorAll(".nav-link") || [];
  const pages = document.querySelectorAll(".page") || [];
  const homePage = $("home-page") || null;

  const profilePicInput = $("profile-pic-input") || null;
  const profileImg = $("profile-img") || null;
  const profilePictureCircle = $("profile-picture-circle") || null;
  const profilePicMenu = $("profile-pic-menu") || null;
  const btnChoosePhoto = $("btn-choose-photo") || null;
  const btnRemovePhoto = $("btn-remove-photo") || null;
  const btnCancelPhotoMenu = $("btn-cancel-photo-menu") || null;
  
  // Modal de crop
  const modalCropFoto = $("modal-crop-foto") || null;
  const cropImage = $("crop-image") || null;
  const btnZoomIn = $("btn-zoom-in") || null;
  const btnZoomOut = $("btn-zoom-out") || null;
  const btnRotateLeft = $("btn-rotate-left") || null;
  const btnRotateRight = $("btn-rotate-right") || null;
  const btnResetCrop = $("btn-reset-crop") || null;
  const btnCancelarCrop = $("btn-cancelar-crop") || null;
  const btnSalvarCrop = $("btn-salvar-crop") || null;

  const btnAlterarSenha = $("btn-alterar-senha") || null;
  const modalAlterarSenha = $("modal-alterar-senha") || null;
  const formAlterarSenha = $("form-alterar-senha") || null;
  const alterarSenhaMessage = $("alterar-senha-message") || null;

  const btnExcluirConta = $("btn-excluir-conta") || null;
  const modalExcluirConta = $("modal-excluir-conta") || null;
  const btnConfirmarExclusao = $("btn-confirmar-exclusao") || null;
  const btnCancelarExclusao = $("btn-cancelar-exclusao") || null;

  const themeToggle = $("theme-toggle") || null;

  /* -----------------------
     State
  ------------------------*/
  let resetToken = null;
  let currentUser = null;
  let cropper = null; // Instância do Cropper.js

  /* -----------------------
     Utilities
  ------------------------*/
  function showError(element, message) {
    if (!element) {
      // fallback: console
      console.error("showError:", message);
      return;
    }
    element.classList.remove("success-message");
    element.classList.add("error-message");
    element.textContent = message;
    element.classList.add("show");
    setTimeout(() => {
      element.classList.remove("show");
      // keep message cleared
      element.textContent = "";
    }, 5000);
  }

  function showSuccess(element, message) {
    if (!element) return;
    element.classList.remove("error-message");
    element.classList.add("success-message");
    element.textContent = message;
    element.classList.add("show");
    setTimeout(() => {
      element.classList.remove("show");
      element.textContent = "";
    }, 5000);
  }

  function updateProfileUI(user = {}) {
    const pn = $("profile-name");
    const pe = $("profile-email");
    if (pn) pn.textContent = user.username || "Não informado";
    if (pe) pe.textContent = user.email || "Não informado";

    const sidebarUsername = $("sidebar-username");
    if (sidebarUsername) sidebarUsername.textContent = user.username || "";
  }

  function applyTheme(theme) {
    if (!body) return;
    body.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}

    // Lógica para alternar o texto do link de tema
    const nextThemeText = theme === "dark" ? "Modo Claro" : "Modo Escuro";
    // Seleciona todos os links de alternância de tema nos menus laterais
    const themeToggles = document.querySelectorAll(
      '.splash-sidebar-nav a[id$="-nav-theme-toggle"]'
    );
    themeToggles.forEach((toggle) => {
      toggle.textContent = nextThemeText;
    });

    if (themeToggle) {
      themeToggle.classList.toggle("active", theme === "dark");
    }
  }

  // Inicializa o tema e garante que o texto do link de alternância esteja correto
  (function initTheme() {
    const saved = (() => {
      try {
        return localStorage.getItem("theme");
      } catch (e) {
        return null;
      }
    })();
    // Garante que o tema inicial seja aplicado e o texto do link seja atualizado
    applyTheme(saved || "dark");
  })();

  function switchScreen(hideScreen, showScreen) {
    // hide/show with guards
    if (hideScreen && hideScreen.classList) hideScreen.classList.remove("active");
    if (showScreen && showScreen.classList) showScreen.classList.add("active");

    // Lógica de controle de música
    const isWelcomeScreen = showScreen && showScreen.id === "welcome-splash";
    const isGameScreen = showScreen && (showScreen.id === "home-page" || showScreen.id === "profile-page"); // Assumindo que 'home-page' é a tela pós-login/registro onde os jogos são acessados

    if (isWelcomeScreen) {
      startMusic();
    } else if (isGameScreen) {
      stopMusic();
    }
  }

  function logout() {
    try {
      localStorage.removeItem("cardYXSUser");
      localStorage.removeItem("profileImg");
    } catch (e) {}
    currentUser = null;

    // Go to login screen if available
    if (loginScreen) {
      // if welcomeScreen exists, hide it
      switchScreen(welcomeScreen, loginScreen);
    } else {
      // hide other pages
      pages.forEach((p) => p.classList.remove("active"));
      if (homePage) homePage.classList.remove("active");
    }

    // close menu safely
    if (sidebarMenu) sidebarMenu.classList.remove("active");
    if (menuOverlay) menuOverlay.classList.remove("active");
  }

  async function fetchStats(token) {
    try {
      const res = await fetch(`${API_URL}/api/scores/user-stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Erro ao carregar estatísticas.");
      }

      const stats = await res.json();
      
      // Atualizar elementos da página de perfil
      safe($("profile-caca-score"), (el) => el.textContent = stats.cacaPalavrasScore || 0);
      safe($("profile-tictactoe-wins"), (el) => el.textContent = stats.tictactoeWins || 0);
      safe($("profile-tictactoe-losses"), (el) => el.textContent = stats.tictactoeLosses || 0);
      safe($("profile-tictactoe-ties"), (el) => el.textContent = stats.tictactoeTies || 0);
      safe($("profile-total-games"), (el) => el.textContent = stats.totalGamesPlayed || 0);
      safe($("profile-best-streak"), (el) => el.textContent = stats.bestStreak || 0);

      // Atualizar elementos da página Home (se existirem)
      safe($("total-score-display"), (el) => el.textContent = stats.cacaPalavrasScore || 0);
      safe($("games-played-display"), (el) => el.textContent = stats.totalGamesPlayed || 0);
      safe($("streak-display"), (el) => el.textContent = stats.currentStreak || 0);

    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err.message || err);
      // Opcional: Mostrar mensagem de erro na tela
    }
  }

  async function saveCacaPalavrasScore(score) {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("cardYXSUser"));
    } catch (e) {
      storedUser = null;
    }

    if (!storedUser || !storedUser.token) {
      console.warn("Usuário não autenticado. Não é possível salvar a pontuação.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/scores/update-caca-palavras-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedUser.token}`,
        },
        body: JSON.stringify({ score }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Erro ao salvar pontuação no backend");
      }

      const data = await res.json();
      console.log("Pontuação do Caça-Palavras salva com sucesso:", data.newScore);
      // Opcional: Atualizar a pontuação na UI após o salvamento
      fetchStats(storedUser.token);

    } catch (err) {
      console.error("Erro ao salvar pontuação:", err.message || err);
    }
  }

  function loadProfileData() {
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem("cardYXSUser"));
    } catch (e) {
      stored = null;
    }
    if (stored && stored.token) {
      currentUser = stored;
      updateProfileUI(stored.user || {});
      const profilePictureUrl = stored.user && stored.user.profilePicture;
      const profilePlaceholder = $("profile-placeholder");
      if (profileImg && profilePictureUrl) {
        profileImg.src = profilePictureUrl;
        profileImg.style.display = "block";
        if (profilePlaceholder) profilePlaceholder.style.display = "none";
        try {
          localStorage.setItem("profileImg", profilePictureUrl);
        } catch (e) {}
      } else if (profileImg && !profilePictureUrl) {
        profileImg.style.display = "none";
        if (profilePlaceholder) profilePlaceholder.style.display = "flex";
      }

      // NEW: Fetch user stats
      fetchStats(stored.token);

      // Show main/welcome if exists
      if (welcomeScreen && loginScreen) {
        switchScreen(loginScreen, welcomeScreen);
      }
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
      storedUser = JSON.parse(localStorage.getItem("cardYXSUser"));
    } catch (e) {
      storedUser = null;
    }

    if (!storedUser || !storedUser.token) {
      console.warn("Usuário não autenticado. Não é possível salvar a foto.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/update-profile-picture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedUser.token}`,
        },
        body: JSON.stringify({ profilePicture: base64Image }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Erro ao salvar foto de perfil");
      }
      storedUser.user = storedUser.user || {};
      storedUser.user.profilePicture = base64Image;
      localStorage.setItem("cardYXSUser", JSON.stringify(storedUser));
      currentUser = storedUser;
      console.log("Foto atualizada no backend");
    } catch (err) {
      console.error("Erro ao salvar foto:", err.message || err);
    }
  }

  /* -----------------------
     Event registrations (safe)
  ------------------------*/
  safe(menuToggle, (el) => {
    el.addEventListener("click", () => {
      if (sidebarMenu) sidebarMenu.classList.add("active");
      if (menuOverlay) menuOverlay.classList.add("active");
    });
  });
  safe(closeMenu, (el) => {
    el.addEventListener("click", () => {
      if (sidebarMenu) sidebarMenu.classList.remove("active");
      if (menuOverlay) menuOverlay.classList.remove("active");
    });
  });
  safe(menuOverlay, (el) => {
    el.addEventListener("click", () => {
      if (sidebarMenu) sidebarMenu.classList.remove("active");
      if (menuOverlay) menuOverlay.classList.remove("active");
    });
  });

  // Navegação principal
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("data-target");
      if (targetId) {
        pages.forEach((page) => page.classList.remove("active"));
        const targetPage = $(targetId);
        if (targetPage) targetPage.classList.add("active");

        navLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");

        if (targetId === "perfil-page") {
          loadProfileData();
        }
      }

      if (link.id === "nav-sair") {
        logout();
      }

      if (sidebarMenu) sidebarMenu.classList.remove("active");
      if (menuOverlay) menuOverlay.classList.remove("active");
    });
  });

  // Funções do menu de foto de perfil
  function showProfilePicMenu() {
    if (profilePicMenu) {
      profilePicMenu.style.display = "flex";
    }
  }

  function hideProfilePicMenu() {
    if (profilePicMenu) {
      profilePicMenu.style.display = "none";
    }
  }

  async function removeProfilePicture() {
    // Atualizar UI imediatamente
    if (profileImg) {
      profileImg.src = "";
      profileImg.style.display = "none";
    }
    const profilePlaceholder = $("profile-placeholder");
    if (profilePlaceholder) profilePlaceholder.style.display = "flex";
    
    // Atualizar localStorage
    try {
      localStorage.removeItem("profileImg");
      let storedUser = JSON.parse(localStorage.getItem("cardYXSUser") || "null");
      if (storedUser) {
        storedUser.user = storedUser.user || {};
        storedUser.user.profilePicture = "";
        localStorage.setItem("cardYXSUser", JSON.stringify(storedUser));
        currentUser = storedUser;
      }
    } catch (e) {
      console.error("Erro ao atualizar localStorage:", e);
    }
    
    // Tentar atualizar no backend se API_URL estiver configurado
    if (API_URL) {
      try {
        let storedUser = JSON.parse(localStorage.getItem("cardYXSUser") || "null");
        if (storedUser && storedUser.token) {
          const res = await fetch(`${API_URL}/api/auth/update-profile-picture`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${storedUser.token}`,
            },
            body: JSON.stringify({ profilePicture: "" }),
          });
          if (res.ok) {
            console.log("Foto removida no backend");
          }
        }
      } catch (err) {
        console.error("Erro ao remover foto no backend:", err.message || err);
      }
    }
    
    console.log("Foto removida com sucesso");
  }

  // Clicar no círculo da foto abre o menu
  safe(profilePictureCircle, (el) => {
    el.addEventListener("click", (e) => {
      if (e.target.id === "profile-pic-input") return;
      showProfilePicMenu();
    });
  });

  // Botão "Escolher foto"
  safe(btnChoosePhoto, (el) => {
    el.addEventListener("click", () => {
      hideProfilePicMenu();
      if (profilePicInput) profilePicInput.click();
    });
  });

  // Botão "Remover foto"
  safe(btnRemovePhoto, (el) => {
    el.addEventListener("click", async () => {
      hideProfilePicMenu();
      await removeProfilePicture();
    });
  });

  // Botão "Cancelar"
  safe(btnCancelPhotoMenu, (el) => {
    el.addEventListener("click", () => {
      hideProfilePicMenu();
    });
  });

  // Fechar menu ao clicar fora
  document.addEventListener("click", (e) => {
    if (profilePicMenu && profilePictureCircle) {
      const isClickInsideMenu = profilePicMenu.contains(e.target);
      const isClickOnCircle = profilePictureCircle.contains(e.target);
      
      if (!isClickInsideMenu && !isClickOnCircle && profilePicMenu.style.display === "flex") {
        hideProfilePicMenu();
      }
    }
  });

  // Upload de foto de perfil - abre modal de crop
  safe(profilePicInput, (el) => {
    el.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const imageData = event.target.result;
          
          // Abrir modal de crop
          if (modalCropFoto && cropImage) {
            cropImage.src = imageData;
            modalCropFoto.classList.add("active");
            
            // Inicializar Cropper.js
            if (cropper) {
              cropper.destroy();
            }
            
            cropper = new Cropper(cropImage, {
              aspectRatio: 1,
              viewMode: 1,
              dragMode: 'move',
              autoCropArea: 1,
              restore: false,
              guides: true,
              center: true,
              highlight: false,
              cropBoxMovable: false,
              cropBoxResizable: false,
              toggleDragModeOnDblclick: false,
            });
          }
        };
        reader.readAsDataURL(file);
      }
      // Limpar o input para permitir selecionar a mesma foto novamente
      e.target.value = '';
    });
  });

  // Botões de controle do crop
  safe(btnZoomIn, (el) => {
    el.addEventListener("click", () => {
      if (cropper) cropper.zoom(0.1);
    });
  });

  safe(btnZoomOut, (el) => {
    el.addEventListener("click", () => {
      if (cropper) cropper.zoom(-0.1);
    });
  });

  safe(btnRotateLeft, (el) => {
    el.addEventListener("click", () => {
      if (cropper) cropper.rotate(-90);
    });
  });

  safe(btnRotateRight, (el) => {
    el.addEventListener("click", () => {
      if (cropper) cropper.rotate(90);
    });
  });

  safe(btnResetCrop, (el) => {
    el.addEventListener("click", () => {
      if (cropper) cropper.reset();
    });
  });

  // Cancelar crop
  safe(btnCancelarCrop, (el) => {
    el.addEventListener("click", () => {
      if (modalCropFoto) modalCropFoto.classList.remove("active");
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
    });
  });

  // Salvar foto cortada
  safe(btnSalvarCrop, (el) => {
    el.addEventListener("click", () => {
      if (cropper) {
        const canvas = cropper.getCroppedCanvas({
          width: 400,
          height: 400,
          imageSmoothingQuality: 'high',
        });
        
        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
        
        // Atualizar a foto de perfil
        if (profileImg) {
          profileImg.src = croppedImage;
          profileImg.style.display = "block";
          const profilePlaceholder = $("profile-placeholder");
          if (profilePlaceholder) profilePlaceholder.style.display = "none";
        }
        
        // Salvar no backend e localStorage
        saveProfilePicture(croppedImage);
        
        // Fechar modal
        if (modalCropFoto) modalCropFoto.classList.remove("active");
        cropper.destroy();
        cropper = null;
      }
    });
  });

  // Modal de alterar senha
  safe(btnAlterarSenha, (el) => {
    el.addEventListener("click", () => {
      if (modalAlterarSenha) modalAlterarSenha.classList.add("active");
    });
  });

  // close modal generic (elements with data-modal or .modal-close)
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-modal");
      if (modalId && $(modalId)) $(modalId).classList.remove("active");
      else {
        // try parent modal
        const parent = btn.closest(".modal");
        if (parent) parent.classList.remove("active");
      }
    });
  });

  if (formAlterarSenha) {
    formAlterarSenha.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPassword =
        ($("current-password") && $("current-password").value) || "";
      const newPassword = ($("new-password") && $("new-password").value) || "";
      const confirmNewPassword =
        ($("confirm-new-password") && $("confirm-new-password").value) || "";
      if (newPassword !== confirmNewPassword) {
        showError(alterarSenhaMessage, "As novas senhas não coincidem!");
        return;
      }
      if (newPassword.length < 6) {
        showError(
          alterarSenhaMessage,
          "A nova senha deve ter pelo menos 6 caracteres!"
        );
        return;
      }
      const submitBtn = formAlterarSenha.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Alterando...";
      }
      try {
        const storedUser = JSON.parse(localStorage.getItem("cardYXSUser") || "null");
        if (!storedUser || !storedUser.token)
          throw new Error("Usuário não autenticado.");
        const response = await fetch(`${API_URL}/api/auth/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedUser.token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmNewPassword,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data.error || "Erro ao alterar senha.");
        showSuccess(alterarSenhaMessage, "Senha alterada com sucesso!");
        formAlterarSenha.reset();
        setTimeout(
          () =>
            modalAlterarSenha && modalAlterarSenha.classList.remove("active"),
          1500
        );
      } catch (err) {
        console.error("Erro ao alterar senha:", err);
        showError(alterarSenhaMessage, err.message || "Erro ao alterar senha.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Alterar Senha";
        }
      }
    });
  }

  // Modal exclusão de conta
  safe(btnExcluirConta, (el) => {
    el.addEventListener("click", () => {
      if (modalExcluirConta) modalExcluirConta.classList.add("active");
    });
  });
  safe(btnCancelarExclusao, (el) => {
    el.addEventListener("click", () => {
      if (modalExcluirConta) modalExcluirConta.classList.remove("active");
    });
  });
  if (btnConfirmarExclusao) {
    btnConfirmarExclusao.addEventListener("click", async () => {
      const passwordInput = $("excluir-senha");
      const excluirMessage = $("excluir-conta-message") || null;
      const password = passwordInput ? passwordInput.value : "";
      if (!password) {
        showError(
          excluirMessage,
          "A senha é obrigatória para confirmar a exclusão."
        );
        return;
      }
      btnConfirmarExclusao.disabled = true;
      btnConfirmarExclusao.textContent = "Excluindo...";
      try {
        const storedUser = JSON.parse(
          localStorage.getItem("cardYXSUser") || "null"
        );
        if (!storedUser || !storedUser.token)
          throw new Error("Usuário não autenticado.");
        const response = await fetch(`${API_URL}/api/auth/delete-account`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedUser.token}`,
          },
          body: JSON.stringify({ password }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data.message || "Erro ao excluir conta.");
        showSuccess(excluirMessage, "Conta excluída com sucesso!");
        setTimeout(() => {
          if (modalExcluirConta) modalExcluirConta.classList.remove("active");
          logout();
        }, 1000);
      } catch (err) {
        console.error("Erro ao excluir conta:", err);
        showError(
          $("excluir-conta-message"),
          err.message || "Erro ao excluir conta."
        );
      } finally {
        btnConfirmarExclusao.disabled = false;
        btnConfirmarExclusao.textContent = "Excluir Conta";
        if (passwordInput) passwordInput.value = "";
      }
    });
  }

  // Links between auth screens (safe)
  safe($("switch-to-register"), (el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      switchScreen(loginScreen, registerScreen);
    })
  );
  safe($("switch-to-forgot-password"), (el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      switchScreen(loginScreen, forgotPasswordScreen);
    })
  );
  safe($("switch-to-login"), (el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      switchScreen(registerScreen, loginScreen);
    })
  );
  safe($("switch-to-login-from-forgot"), (el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      forgotPasswordForm && forgotPasswordForm.reset();
      if (forgotPasswordMessage) {
        forgotPasswordMessage.classList.remove("show");
        forgotPasswordMessage.textContent =
          "Se o e-mail existir, um link de recuperação será enviado.";
      }
      switchScreen(forgotPasswordScreen, loginScreen);
    })
  );
  safe($("switch-to-login-from-reset"), (el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      switchScreen(resetPasswordScreen, loginScreen);
    })
  );

  // Toggle password icons
  document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", () => {
      const targetId = icon.getAttribute("data-target");
      const targetInput = targetId ? $(targetId) : null;
      if (!targetInput) return;
      if (targetInput.type === "password") {
        targetInput.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        targetInput.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });

  // Parse reset token from URL hash (safe)
  function parseResetURL() {
    const hash = window.location.hash || "";
    if (hash.startsWith("#/reset-password")) {
      const questionMarkIndex = hash.indexOf("?");
      if (questionMarkIndex !== -1) {
        const queryString = hash.substring(questionMarkIndex + 1);
        const urlParams = new URLSearchParams(queryString);
        const token = urlParams.get("token");
        const email = urlParams.get("email");
        if (token && email) {
          resetToken = token;
          const resetEmailEl = $("reset-email");
          if (resetEmailEl) resetEmailEl.value = email;
          switchScreen(loginScreen, resetPasswordScreen);
          return true;
        }
      }
    }
    return false;
  }

  // Register form submit
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = $("username") ? $("username").value : "";
      const email = $("email") ? $("email").value : "";
      const password = $("password") ? $("password").value : "";
      const confirmPassword = $("confirm-password") ? $("confirm-password").value : "";
      const submitBtn = registerForm.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Registrando...";
      }
      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, confirmPassword }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data.error || "Erro ao registrar usuário.");
        localStorage.setItem("cardYXSUser", JSON.stringify(data));
        currentUser = data;
        updateProfileUI(data.user || {});
        loadProfileData();
        registerForm.reset();
      } catch (err) {
        console.error("Erro no registro:", err);
        showError(errorMessage, err.message || "Erro ao registrar. Tente novamente.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Registrar";
        }
      }
    });
  }

  // Login form submit
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const identifier = loginIdentifierInput ? loginIdentifierInput.value : "";
      const password = $("login-password") ? $("login-password").value : "";
      const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
      const submitBtn = loginForm.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Entrando...";
      }
      try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password, rememberMe }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Erro ao fazer login.");
        localStorage.setItem("cardYXSUser", JSON.stringify(data));
        currentUser = data;
        updateProfileUI(data.user || {});
        loadProfileData();
        loginForm.reset();
      } catch (err) {
        console.error("Erro no login:", err);
        showError(
          loginErrorMessage,
          err.message || "Erro ao fazer login. Tente novamente."
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Entrar";
        }
      }
    });
  }

  // Forgot password submit
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("forgot-password-email")
        ? $("forgot-password-email").value
        : "";
      const submitBtn = forgotPasswordForm.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";
      }
      try {
        const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 404)
            throw new Error(data.error || "E-mail não cadastrado.");
          throw new Error(
            data.error || "Erro ao solicitar recuperação de senha."
          );
        }
        showSuccess(
          forgotPasswordMessage,
          "Link de recuperação enviado! Verifique sua caixa de entrada."
        );
        forgotPasswordForm.reset();
      } catch (err) {
        console.error("Erro em esqueci a senha:", err);
        showError(
          forgotPasswordMessage,
          err.message || "Erro ao solicitar recuperação de senha. Tente novamente."
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Enviar Link de Recuperação";
        }
      }
    });
  }

  // Reset password submit
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("reset-email") ? $("reset-email").value : "";
      const newPassword = $("reset-new-password")
        ? $("reset-new-password").value
        : "";
      const confirmPassword = $("reset-confirm-password")
        ? $("reset-confirm-password").value
        : "";
      const submitBtn = resetPasswordForm.querySelector("button[type='submit']");
      if (newPassword !== confirmPassword) {
        showError(resetPasswordMessage, "As senhas não coincidem!");
        return;
      }
      if (newPassword.length < 6) {
        showError(
          resetPasswordMessage,
          "A nova senha deve ter pelo menos 6 caracteres!"
        );
        return;
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Redefinindo...";
      }
      try {
        if (!resetToken)
          throw new Error(
            "Token de redefinição ausente. Tente novamente a recuperação de senha."
          );
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: resetToken,
            email,
            newPassword,
            confirmPassword,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(
            data.error || "Erro ao redefinir senha. Token inválido ou expirado."
          );
        showSuccess(
          resetPasswordMessage,
          data.message || "Senha redefinida com sucesso! Redirecionando..."
        );
        resetPasswordForm.reset();
        setTimeout(() => {
          switchScreen(resetPasswordScreen, loginScreen);
          if (resetPasswordMessage)
            resetPasswordMessage.classList.remove("show");
        }, 2000);
      } catch (err) {
        console.error("Erro ao redefinir senha:", err);
        showError(
          resetPasswordMessage,
          err.message || "Erro ao redefinir senha. Tente novamente."
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Redefinir Senha";
        }
      }
    });
  }

  // Theme toggle
  safe(themeToggle, (el) =>
    el.addEventListener("click", () => {
      const current = body && body.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
    })
  );

  // Toggle eye icons already attached above

  // Funcionalidade de Pull to Refresh removida para evitar recarregamento indesejado ao rolar para cima.

  // Hide all pages except home on load
  pages.forEach((page) => {
    if (page.id !== "home-page" && page.classList)
      page.classList.remove("active");
  });

  if (welcomeScreen && welcomeScreen.classList.contains("active")) {
    if (homePage) homePage.classList.add("active");
  }

  // Initially hide login screen if splash is active
  if (welcomeSplash && welcomeSplash.classList.contains("active")) {
    if (loginScreen) loginScreen.classList.remove("active");
  }

  // Welcome Splash Button Handler
  safe(btnEntrar, (el) => {
    el.addEventListener("click", () => {
      if (welcomeSplash && loginScreen) {
        switchScreen(welcomeSplash, loginScreen);
      }
    });
  });

  // Splash Menu Toggle Handler
  safe(splashMenuToggle, (el) => {
    el.addEventListener("click", () => {
      if (splashSidebarMenu) splashSidebarMenu.classList.add("active");
    });
  });

  // Splash Close Menu Handler
  safe(splashCloseMenu, (el) => {
    el.addEventListener("click", () => {
      if (splashSidebarMenu) splashSidebarMenu.classList.remove("active");
    });
  });

  // Splash Nav Entrar
  safe(splashNavEntrar, (el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (splashSidebarMenu) splashSidebarMenu.classList.remove("active");
      if (welcomeSplash && loginScreen) {
        switchScreen(welcomeSplash, loginScreen);
      }
    });
  });

  // Splash Nav Registrar
  safe(splashNavRegistrar, (el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (splashSidebarMenu) splashSidebarMenu.classList.remove("active");
      if (welcomeSplash && registerScreen) {
        switchScreen(welcomeSplash, registerScreen);
      }
    });
  });

  // Splash Nav Theme Toggle
  safe($("splash-nav-theme-toggle"), (el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const current = body && body.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      if (splashSidebarMenu) splashSidebarMenu.classList.remove("active");
    });
  });

  // Close splash sidebar when clicking outside
  document.addEventListener("click", (e) => {
    if (splashSidebarMenu && splashMenuToggle) {
      const isClickInsideSidebar = splashSidebarMenu.contains(e.target);
      const isClickOnToggle = splashMenuToggle.contains(e.target);
      if (
        !isClickInsideSidebar &&
        !isClickOnToggle &&
        splashSidebarMenu.classList.contains("active")
      ) {
        splashSidebarMenu.classList.remove("active");
      }
    }
  });

  // Generic function to setup menu for any screen
  function setupScreenMenu(
    menuToggle,
    sidebarMenu,
    closeMenu,
    navHome,
    navEntrar,
    navRegistrar,
    navModoClaro,
    navModoEscuro,
    fromScreen,
    toLoginScreen,
    toRegisterScreen
  ) {
    safe(menuToggle, (el) => {
      el.addEventListener("click", () => {
        if (sidebarMenu) sidebarMenu.classList.add("active");
      });
    });

    safe(closeMenu, (el) => {
      el.addEventListener("click", () => {
        if (sidebarMenu) sidebarMenu.classList.remove("active");
      });
    });

    safe(navHome, (el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (sidebarMenu) sidebarMenu.classList.remove("active");
        // O welcomeSplash é a tela inicial com o gif
        if (fromScreen && welcomeSplash) switchScreen(fromScreen, welcomeSplash);
      });
    });

    safe(navEntrar, (el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (sidebarMenu) sidebarMenu.classList.remove("active");
        if (fromScreen && toLoginScreen) switchScreen(fromScreen, toLoginScreen);
      });
    });

    safe(navRegistrar, (el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (sidebarMenu) sidebarMenu.classList.remove("active");
        if (fromScreen && toRegisterScreen)
          switchScreen(fromScreen, toRegisterScreen);
      });
    });

    // Novo manipulador de evento para o link de alternância de tema
    safe(navModoClaro, (el) => {
      // navModoClaro agora é o ID do novo link de alternância
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const current = body && body.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        applyTheme(next);
        if (sidebarMenu) sidebarMenu.classList.remove("active");
      });
    });

    document.addEventListener("click", (e) => {
      if (sidebarMenu && menuToggle) {
        const isClickInsideSidebar = sidebarMenu.contains(e.target);
        const isClickOnToggle = menuToggle.contains(e.target);
        if (
          !isClickInsideSidebar &&
          !isClickOnToggle &&
          sidebarMenu.classList.contains("active")
        ) {
          sidebarMenu.classList.remove("active");
        }
      }
    });
  }

  // Setup menus for each screen
  setupScreenMenu(
    loginMenuToggle,
    loginSidebarMenu,
    loginCloseMenu,
    $("login-nav-home"),
    $("login-nav-entrar"),
    $("login-nav-registrar"),
    $("login-nav-theme-toggle"),
    null,
    loginScreen,
    loginScreen,
    registerScreen
  );
  setupScreenMenu(
    registerMenuToggle,
    registerSidebarMenu,
    registerCloseMenu,
    $("register-nav-home"),
    $("register-nav-entrar"),
    $("register-nav-registrar"),
    $("register-nav-theme-toggle"),
    null,
    registerScreen,
    loginScreen,
    registerScreen
  );
  setupScreenMenu(
    forgotMenuToggle,
    forgotSidebarMenu,
    forgotCloseMenu,
    $("forgot-nav-home"),
    $("forgot-nav-entrar"),
    $("forgot-nav-registrar"),
    $("forgot-nav-theme-toggle"),
    null,
    forgotPasswordScreen,
    loginScreen,
    registerScreen
  );
  setupScreenMenu(
    resetMenuToggle,
    resetSidebarMenu,
    resetCloseMenu,
    $("reset-nav-home"),
    $("reset-nav-entrar"),
    $("reset-nav-registrar"),
    $("reset-nav-theme-toggle"),
    null,
    resetPasswordScreen,
    loginScreen,
    registerScreen
  );

  // Parse URL (reset) and check login on load
  document.addEventListener("DOMContentLoaded", () => {
    const isReset = parseResetURL();
    if (!isReset) {
      // Check if user is logged in
      let stored = null;
      try {
        stored = JSON.parse(localStorage.getItem("cardYXSUser"));
      } catch (e) {
        stored = null;
      }
      // If not logged in, show splash screen; otherwise load profile
      if (!stored || !stored.token) {
        if (welcomeSplash && loginScreen) {
          switchScreen(loginScreen, welcomeSplash);
        }
      } else {
        loadProfileData();
      }
    }
  });

  /* -----------------------
     Botão para abrir Caça-Palavras
  ------------------------*/
  const btnOpenCacaPalavras = $("btn-open-cacapalavras");
  safe(btnOpenCacaPalavras, (el) => {
    el.addEventListener("click", () => {
      window.open("caca-palavras.html", "_blank");
    });
  });

	  // Adiciona listeners para tentar iniciar a reprodução na primeira interação do usuário
	  // Isso é necessário para contornar a política de autoplay dos navegadores
	  document.addEventListener('click', startMusic, { once: true });
	  document.addEventListener('touchstart', startMusic, { once: true });

	  // Export for debugging (optional)
	  window.__App = {
    logout,
    loadProfileData,
    applyTheme,
    saveCacaPalavrasScore,
  };
})();
