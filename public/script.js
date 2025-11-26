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

menuToggle.addEventListener("click", () => {
  sidebarMenu.classList.add("active");
  menuOverlay.classList.add("active");
});

closeMenu.addEventListener("click", () => {
  sidebarMenu.classList.remove("active");
  menuOverlay.classList.remove("active");
});

menuOverlay.addEventListener("click", () => {
  sidebarMenu.classList.remove("active");
  menuOverlay.classList.remove("active");
});

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
  sidebarMenu.classList.remove("active");
  menuOverlay.classList.remove("active");
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

// --- MODAL DE ALTERAÇÃO DE SENHA ---
const btnAlterarSenha = document.getElementById("btn-alterar-senha");
const modalAlterarSenha = document.getElementById("modal-alterar-senha");
const formAlterarSenha = document.getElementById("form-alterar-senha");
const alterarSenhaMessage = document.getElementById("alterar-senha-message");

btnAlterarSenha.addEventListener("click", () => {
  modalAlterarSenha.classList.add("active");
});

// Fechar modal
document.querySelectorAll(".modal-close").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const modalId = btn.getAttribute("data-modal");
    document.getElementById(modalId).classList.remove("active");
  });
});

// Enviar formulário de alteração de senha
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
    // Aqui você faria a chamada para a API para alterar a senha
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
    alterarSenhaMessage.classList.remove("error-message");
    alterarSenhaMessage.classList.add("success-message");
    alterarSenhaMessage.textContent = "Senha alterada com sucesso!";
    alterarSenhaMessage.classList.add("show");
    
    // Limpar formulário
    formAlterarSenha.reset();
    
    // Fechar modal após 2 segundos
    setTimeout(() => {
      modalAlterarSenha.classList.remove("active");
      alterarSenhaMessage.classList.remove("show");
    }, 2000);
    
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    // O bloco finally já reativa o botão, mas o erro pode ser mais específico.
    showError(alterarSenhaMessage, error.message || "Erro ao alterar senha. Tente novamente.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Alterar Senha";
  }
});

// --- MODAL DE EXCLUSÃO DE CONTA ---
const btnExcluirConta = document.getElementById("btn-excluir-conta");
const modalExcluirConta = document.getElementById("modal-excluir-conta");
const btnConfirmarExclusao = document.getElementById("btn-confirmar-exclusao");
const btnCancelarExclusao = document.getElementById("btn-cancelar-exclusao");

btnExcluirConta.addEventListener("click", () => {
  modalExcluirConta.classList.add("active");
});

btnCancelarExclusao.addEventListener("click", () => {
  modalExcluirConta.classList.remove("active");
});

btnConfirmarExclusao.addEventListener("click", async () => {
  const passwordInput = document.getElementById("excluir-senha");
  const password = passwordInput.value;
  const excluirMessage = document.getElementById("excluir-conta-message");
  
  if (!password) {
    showError(excluirMessage, "A senha é obrigatória para confirmar a exclusão.");
    return;
  }
  
  // Desabilitar botão
  btnConfirmarExclusao.disabled = true;
  btnConfirmarExclusao.textContent = "Excluindo...";
  
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
        throw new Error(data.message || "Erro ao excluir conta.");
    }
    
    // Mostrar sucesso
    excluirMessage.classList.remove("error-message");
    excluirMessage.classList.add("success-message");
    excluirMessage.textContent = "Conta excluída com sucesso!";
    excluirMessage.classList.add("show");
    
    // Fazer logout após 1 segundo
    setTimeout(() => {
      modalExcluirConta.classList.remove("active");
      logout();
    }, 1000);
    
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    showError(excluirMessage, error.message || "Erro ao excluir conta. Tente novamente.");
  } finally {
    btnConfirmarExclusao.disabled = false;
    btnConfirmarExclusao.textContent = "Confirmar Exclusão";
    passwordInput.value = ""; // Limpar campo de senha
  }
});

// --- FUNÇÃO AUXILIAR PARA MOSTRAR ERROS ---
function showError(element, message) {
  element.classList.remove("success-message");
  element.classList.add("error-message");
  element.textContent = message;
  element.classList.add("show");
  setTimeout(() => {
    element.classList.remove("show");
  }, 5000);
}

// --- LÓGICA DE REGISTRO ---
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  
  // Desabilitar botão
  const submitBtn = registerForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Registrando...";
  
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password, confirmPassword }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Erro ao registrar usuário.");
    }
    
    // Se o registro for bem-sucedido, armazena o token e os dados do usuário
    localStorage.setItem("cardYXSUser", JSON.stringify(data));
    
    // CORREÇÃO: Atualizar a variável global currentUser e a UI
    currentUser = data;
    updateProfileUI(data.user);
    
    loadProfileData(); // Carrega os dados do perfil e muda a tela
    
    // Limpar formulário
    registerForm.reset();
    
  } catch (error) {
    console.error("Erro no registro:", error);
    showError(errorMessage, error.message || "Erro ao registrar. Tente novamente.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Registrar";
  }
});

// --- LÓGICA DE LOGIN ---
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const identifier = loginIdentifierInput.value;
  const password = document.getElementById("login-password").value;
  const rememberMe = rememberMeCheckbox.checked;
  
  // Desabilitar botão
  const submitBtn = loginForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Entrando...";
  
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Erro ao fazer login.");
    }
    
    // Se o login for bem-sucedido, armazena o token e os dados do usuário
    localStorage.setItem("cardYXSUser", JSON.stringify(data));
    
    // CORREÇÃO: Atualizar a variável global currentUser e a UI
    currentUser = data;
    updateProfileUI(data.user);
    
    loadProfileData(); // Carrega os dados do perfil e muda a tela
    
    // Limpar formulário
    loginForm.reset();
    
  } catch (error) {
    console.error("Erro no login:", error);
    showError(loginErrorMessage, error.message || "Erro ao fazer login. Tente novamente.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar";
  }
});

// --- LÓGICA DE ESQUECI A SENHA ---
forgotPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("forgot-password-email").value;
  
  // Desabilitar botão
  const submitBtn = forgotPasswordForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";
  
  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Erro ao solicitar recuperação de senha.");
    }
    
    // Mostrar mensagem de sucesso (que é a mesma para segurança)
    forgotPasswordMessage.classList.remove("error-message");
    forgotPasswordMessage.classList.add("success-message");
    // CORREÇÃO: Mensagem mais clara após o envio
    forgotPasswordMessage.textContent = "Link de recuperação enviado! Verifique sua caixa de entrada.";
    forgotPasswordMessage.classList.add("show");
    
    // Limpar formulário
    forgotPasswordForm.reset();
    
    // CORREÇÃO: Limpar a mensagem após 5 segundos
    setTimeout(() => {
      forgotPasswordMessage.classList.remove("show");
      forgotPasswordMessage.textContent = "";
    }, 5000);
    
  } catch (error) {
    console.error("Erro em esqueci a senha:", error);
    showError(forgotPasswordMessage, error.message || "Erro ao solicitar recuperação de senha. Tente novamente.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar Link de Recuperação";
  }
});

// --- LÓGICA DE REDEFINIR SENHA ---
resetPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("reset-email").value;
  const newPassword = document.getElementById("reset-new-password").value;
  const confirmPassword = document.getElementById("reset-confirm-password").value;
  
  // Desabilitar botão
  const submitBtn = resetPasswordForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Redefinindo...";
  
  try {
    if (!resetToken) {
      throw new Error("Token de redefinição ausente.");
    }
    
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: resetToken, email, newPassword, confirmPassword }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Erro ao redefinir senha.");
    }
    
    // Mostrar mensagem de sucesso
    resetPasswordMessage.classList.remove("error-message");
    resetPasswordMessage.classList.add("success-message");
    resetPasswordMessage.textContent = data.message || "Senha redefinida com sucesso!";
    resetPasswordMessage.classList.add("show");
    
    // Limpar formulário
    resetPasswordForm.reset();
    
    // Redirecionar para login após 2 segundos
    setTimeout(() => {
      switchScreen(resetPasswordScreen, loginScreen);
      resetPasswordMessage.classList.remove("show");
    }, 2000);
    
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    showError(resetPasswordMessage, error.message || "Erro ao redefinir senha. Tente novamente.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Redefinir Senha";
  }
});

// --- LÓGICA DE ALTERAÇÃO DE TELA ---
document.getElementById("switch-to-login").addEventListener("click", (e) => {
  e.preventDefault();
  switchScreen(registerScreen, loginScreen);
});

document.getElementById("switch-to-register").addEventListener("click", (e) => {
  e.preventDefault();
  switchScreen(loginScreen, registerScreen);
});

document.getElementById("switch-to-forgot-password").addEventListener("click", (e) => {
  e.preventDefault();
  switchScreen(loginScreen, forgotPasswordScreen);
});

document.getElementById("switch-to-login-from-forgot").addEventListener("click", (e) => {
  e.preventDefault();
  // CORREÇÃO: Limpar o formulário e a mensagem ao voltar para o login
  forgotPasswordForm.reset();
  forgotPasswordMessage.classList.remove("show");
  forgotPasswordMessage.textContent = "Se o e-mail existir, um link de recuperação será enviado."; // Mensagem inicial
  switchScreen(forgotPasswordScreen, loginScreen);
});

document.getElementById("switch-to-login-from-reset").addEventListener("click", (e) => {
  e.preventDefault();
  switchScreen(resetPasswordScreen, loginScreen);
});

// --- LÓGICA DE EXIBIÇÃO DE SENHA ---
document.querySelectorAll(".toggle-password").forEach(icon => {
  icon.addEventListener("click", () => {
    const targetId = icon.getAttribute("data-target");
    const targetInput = document.getElementById(targetId);
    
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

// --- LÓGICA DE PARSE DE URL PARA RESET DE SENHA ---
function parseResetURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const email = urlParams.get('email');
  
  if (token && email) {
    resetToken = token;
    document.getElementById("reset-email").value = decodeURIComponent(email);
    // Mudar para a tela de redefinição de senha
    switchScreen(loginScreen, resetPasswordScreen);
  }
}

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Verificar se há token de reset na URL
  parseResetURL();
  
  // 2. Verificar se o usuário já está logado no localStorage
  checkLoginOnLoad();
});

// --- LÓGICA DE TEMA (CONTINUAÇÃO) ---
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  });
}

// --- FUNÇÃO PARA ATUALIZAR O PERFIL APÓS ATUALIZAÇÃO (FALTA IMPLEMENTAR) ---
// function updateProfile(updatedUser) {
//   currentUser.user = updatedUser;
//   localStorage.setItem("cardYXSUser", JSON.stringify(currentUser));
//   updateProfileUI(updatedUser);
// }

// --- LÓGICA DE NAVEGAÇÃO ENTRE PÁGINAS (CONTINUAÇÃO) ---
// Ocultar todas as páginas exceto a home ao carregar
pages.forEach(page => {
    if (page.id !== 'home-page') {
        page.classList.remove('active');
    }
});

// Garante que a home esteja ativa por padrão no dashboard
if (welcomeScreen.classList.contains('active')) {
    homePage.classList.add('active');
}
