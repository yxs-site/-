// Elementos das telas
const registerScreen = document.getElementById("register-screen");
const loginScreen = document.getElementById("login-screen");
const forgotPasswordScreen = document.getElementById("forgot-password-screen");
const resetPasswordScreen = document.getElementById("reset-password-screen");
const welcomeScreen = document.getElementById("welcome-screen");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const forgotPasswordForm = document.getElementById("forgot-password-form");
const resetPasswordForm = document.getElementById("reset-password-form");
const errorMessage = document.getElementById("error-message");
const loginErrorMessage = document.getElementById("login-error-message");
const forgotPasswordMessage = document.getElementById("forgot-password-message");
const resetPasswordMessage = document.getElementById("reset-password-message");
const body = document.body;

// Elementos de Login
const loginIdentifierInput = document.getElementById("login-identifier");
const rememberMeCheckbox = document.getElementById("remember-me");

// URL da API (ajuste se necessário)
// Forçando para localhost:3000, que é a porta padrão do servidor Node.js
// A URL da API será relativa, pois o frontend e o backend estarão no mesmo servidor.
const API_URL = "";

// Variável global para armazenar o token de reset
let resetToken = null;

// Variável global para armazenar dados do usuário logado
let currentUser = null;

// Função para atualizar a exibição dos dados do usuário na interface
function updateProfileUI(user) {
  document.getElementById("profile-name").textContent = user.username || "Não informado";
  document.getElementById("profile-email").textContent = user.email || "Não informado";
  
  // Se houver um elemento para exibir o nome no menu lateral, atualize-o também
  const sidebarUsername = document.getElementById("sidebar-username");
  if (sidebarUsername) {
    sidebarUsername.textContent = user.username;
  }
}

// --- Lógica de Tema ---
function applyTheme(theme) {
  body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  
  // Atualizar o estado do toggle de tema
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    if (theme === "dark") {
      themeToggle.classList.add("active");
    } else {
      themeToggle.classList.remove("active");
    }
  }
}

// Carregar tema salvo ou usar padrão (escuro)
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

// --- Lógica de Transição de Tela ---
function switchScreen(hideScreen, showScreen) {
  hideScreen.classList.remove("active");
  setTimeout(() => {
    showScreen.classList.add("active");
  }, 500);
}

// --- MENU NAVEGAÇÃO ---
const menuToggle = document.getElementById("menu-toggle");
const sidebarMenu = document.getElementById("sidebar-menu");
const closeMenu = document.getElementById("close-menu");
const menuOverlay = document.getElementById("menu-overlay");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    sidebarMenu.classList.add("active");
    menuOverlay.classList.add("active");
  });
}

if (closeMenu) {
  closeMenu.addEventListener("click", () => {
    sidebarMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
  });
}

if (menuOverlay) {
  menuOverlay.addEventListener("click", () => {
    sidebarMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
  });
}

// --- NAVEGAÇÃO ENTRE PÁGINAS ---
const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");
const homePage = document.getElementById("home-page");

navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    
    // Se for o link de sair
    if (link.id === "nav-sair") {
      logout();
      return;
    }
    
    // Remover classe active de todos os links
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    
    // Ocultar todas as páginas
    pages.forEach(page => page.classList.remove("active"));
    
    // Mostrar página correspondente
    const pageId = link.id.replace("nav-", "") + "-page";
    const page = document.getElementById(pageId);
    if (page) {
      page.classList.add("active");
    }
    
    // Se for a Home, garantir que o link de Home esteja ativo
    if (pageId === "home-page") {
        document.getElementById("nav-home").classList.add("active");
    }
    
    // Fechar menu
    sidebarMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
  });
});

// --- FUNÇÃO DE LOGOUT ---
function logout() {
  localStorage.removeItem("cardYXSUser");
  localStorage.removeItem("profileImg"); // CORREÇÃO: Limpar foto de perfil ao fazer logout
  currentUser = null;
  
  // Redirecionar para a tela de login

  // O welcomeScreen é a tela principal, que contém o menu.
  // O loginScreen é a tela de autenticação.
  switchScreen(welcomeScreen, loginScreen);
  
  // Fechar menu
  if (sidebarMenu) sidebarMenu.classList.remove("active");
  if (menuOverlay) menuOverlay.classList.remove("active");
}

// --- CARREGAR DADOS DO PERFIL ---
function loadProfileData() {
  const storedUser = JSON.parse(localStorage.getItem("cardYXSUser"));
  
  if (storedUser && storedUser.token) {
    currentUser = storedUser;
    // CORREÇÃO: Os dados do usuário estão em storedUser.user
    updateProfileUI(storedUser.user);
    
    // Carregar foto de perfil se existir
    // CORREÇÃO: A foto de perfil deve vir dos dados do usuário (se implementado no backend)
    // Por enquanto, manter a lógica de localStorage, mas garantir que seja limpa no logout.
    const profileImg = localStorage.getItem("profileImg");
    if (profileImg) {
      document.getElementById("profile-img").src = profileImg;
    } else {
      // Se não houver foto no localStorage, usar a padrão (ou a do objeto user, se disponível)
      document.getElementById("profile-img").src = storedUser.user.profilePicture || "caminho/para/foto/padrao.png"; // Assumindo um caminho padrão
    }
    
    // Mostrar a tela principal se o usuário estiver logado
    switchScreen(loginScreen, welcomeScreen);
    
    // Ativar a página Home e o link de navegação
    pages.forEach(page => page.classList.remove("active"));
    homePage.classList.add("active");
    navLinks.forEach(l => l.classList.remove("active"));
    document.getElementById("nav-home").classList.add("active");
    
  } else {
    // Se não houver token, garantir que a tela de login esteja ativa
    switchScreen(welcomeScreen, loginScreen);
  }
}

// --- VERIFICAR LOGIN AO CARREGAR A PÁGINA ---
function checkLoginOnLoad() {
    const storedUser = localStorage.getItem("cardYXSUser");
    if (storedUser) {
        loadProfileData();
    } else {
        // Se não houver token, garantir que a tela de login esteja ativa
        loginScreen.classList.add("active");
        registerScreen.classList.remove("active");
    }
}

// --- UPLOAD DE FOTO DE PERFIL ---
const profilePicInput = document.getElementById("profile-pic-input");
const profileImg = document.getElementById("profile-img");

if (profilePicInput) {
  profilePicInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgData = event.target.result;
        profileImg.src = imgData;
        localStorage.setItem("profileImg", imgData);
        // TODO: Enviar a nova foto para o backend para persistência no banco de dados.
        // O problema de persistência entre contas será resolvido com a limpeza no logout,
        // mas a persistência real da foto precisa de uma chamada ao backend (updateProfile).
      };
      reader.readAsDataURL(file);
    }
  });
}

// --- MODAL DE ALTERAÇÃO DE SENHA ---
const btnAlterarSenha = document.getElementById("btn-alterar-senha");
const modalAlterarSenha = document.getElementById("modal-alterar-senha");
const formAlterarSenha = document.getElementById("form-alterar-senha");
const alterarSenhaMessage = document.getElementById("alterar-senha-message");

if (btnAlterarSenha) {
  btnAlterarSenha.addEventListener("click", () => {
    modalAlterarSenha.classList.add("active");
  });
}

// Fechar modal
document.querySelectorAll(".modal-close").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const modalId = btn.getAttribute("data-modal");
    document.getElementById(modalId).classList.remove("active");
  });
});

// Enviar formulário de alteração de senha
if (formAlterarSenha) {
  formAlterarSenha.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmNewPassword = document.getElementById("confirm-new-password").value;
    
    // Validações
    if (newPassword !== confirmNewPassword) {
      showError(alterarSenhaMessage, "As novas senhas não coincidem!");
      return;
    }
    
    if (newPassword.length < 6) {
      showError(alterarSenhaMessage, "A nova senha deve ter pelo menos 6 caracteres!");
      return;
    }
    
    // Desabilitar botão
    const submitBtn = formAlterarSenha.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Alterando...";
    
    try {
      const storedUser = JSON.parse(localStorage.getItem("cardYXSUser"));
      
      if (!storedUser || !storedUser.token) {
          throw new Error("Usuário não autenticado.");
      }
      
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${storedUser.token}` // Enviar o token JWT
          },
          body: JSON.stringify({
              currentPassword,
              newPassword,
              confirmPassword: confirmNewPassword,
          }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
          throw new Error(data.error || "Erro ao alterar senha.");
      }
      
      // Mostrar sucesso
      showSuccess(alterarSenhaMessage, data.message || "Senha alterada com sucesso!");
      
      // Limpar formulário
      formAlterarSenha.reset();
      
      // Fechar modal após sucesso
      setTimeout(() => {
          modalAlterarSenha.classList.remove("active");
          hideMessage(alterarSenhaMessage);
      }, 2000);
      
    } catch (error) {
      showError(alterarSenhaMessage, error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Alterar Senha";
    }
  });
}

// --- MODAL DE EXCLUSÃO DE CONTA ---
const btnExcluirConta = document.getElementById("btn-excluir-conta");
const modalExcluirConta = document.getElementById("modal-excluir-conta");
const formExcluirConta = document.getElementById("form-excluir-conta");
const excluirContaMessage = document.getElementById("excluir-conta-message");

if (btnExcluirConta) {
  btnExcluirConta.addEventListener("click", () => {
    modalExcluirConta.classList.add("active");
  });
}

// Enviar formulário de exclusão de conta
if (formExcluirConta) {
  formExcluirConta.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const password = document.getElementById("delete-password").value;
    
    // Validação simples
    if (!password) {
      showError(excluirContaMessage, "A senha é obrigatória para confirmar a exclusão.");
      return;
    }
    
    // Desabilitar botão
    const submitBtn = formExcluirConta.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Excluindo...";
    
    try {
      const storedUser = JSON.parse(localStorage.getItem("cardYXSUser"));
      
      if (!storedUser || !storedUser.token) {
          throw new Error("Usuário não autenticado.");
      }
      
      const response = await fetch(`${API_URL}/api/auth/delete-account`, {
          method: "DELETE",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${storedUser.token}` // Enviar o token JWT
          },
          body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
          throw new Error(data.error || "Erro ao excluir conta.");
      }
      
      // Mostrar sucesso e redirecionar para o login
      showSuccess(excluirContaMessage, data.message || "Conta excluída com sucesso!");
      
      // 1. Apagar a conta do usuário do banco de dados MongoDB (feito no backend)
      // 2. Redirecionar o usuário para a página de login após a exclusão
      setTimeout(() => {
          logout(); // Função que limpa o localStorage e redireciona para a tela de login
          modalExcluirConta.classList.remove("active");
      }, 1500);
      
    } catch (error) {
      showError(excluirContaMessage, error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Excluir conta permanentemente";
    }
  });
}

// --- FIM MODAL DE EXCLUSÃO DE CONTA ---

// --- FUNÇÕES AUXILIARES ---
function showError(element, message) {
  element.textContent = message;
  element.classList.remove("success-message");
  element.classList.add("error-message", "show");
}

function showSuccess(element, message) {
  element.textContent = message;
  element.classList.remove("error-message");
  element.classList.add("success-message", "show");
}

function hideMessage(element) {
  element.classList.remove("error-message", "success-message", "show");
  element.textContent = "";
}

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    // Esconder a tela de carregamento e mostrar a tela de login/welcome
    const loadingScreen = document.getElementById("loading-screen");
    
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.remove("active");
            checkLoginOnLoad();
        }, 3000); // 3000 = 3 segundos
    } else {
        checkLoginOnLoad();
    }
});
