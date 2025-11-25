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
  currentUser = null;
  
  // Redirecionar para a tela de login
  // Garantir que o botão de login seja reativado
  const loginSubmitButton = loginForm.querySelector("button[type=\"submit\"]");
  if (loginSubmitButton) {
    loginSubmitButton.disabled = false;
    loginSubmitButton.textContent = "Entrar";
  }
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
    document.getElementById("profile-name").textContent = storedUser.username || "Não informado";
    document.getElementById("profile-email").textContent = storedUser.email || "Não informado";
    
    // Carregar foto de perfil se existir
    const profileImg = localStorage.getItem("profileImg");
    if (profileImg) {
      document.getElementById("profile-img").src = profileImg;
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
        }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || "Erro ao alterar senha.");
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
  // Desabilitar botão
  btnConfirmarExclusao.disabled = true;
  btnConfirmarExclusao.textContent = "Excluindo...";
  
  try {
    // Aqui você faria a chamada para a API para excluir a conta
    const storedUser = JSON.parse(localStorage.getItem("cardYXSUser"));
    
    if (!storedUser || !storedUser.token) {
        throw new Error("Usuário não autenticado.");
    }
    
    const response = await fetch(`${API_URL}/api/auth/delete-account`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${storedUser.token}` // Enviar o token JWT
        },
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao excluir conta.");
    }
    
    // Limpar dados do usuário
    localStorage.removeItem("cardYXSUser");
    localStorage.removeItem("profileImg");
    localStorage.removeItem("rememberedLogin");
    
    currentUser = null;
    
    // Voltar para login
    switchScreen(welcomeScreen, loginScreen);
    modalExcluirConta.classList.remove("active");
    
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    alert("Erro ao excluir conta. Tente novamente.");
    btnConfirmarExclusao.disabled = false;
    btnConfirmarExclusao.textContent = "Excluir Conta";
  }
});

// --- TOGGLE DE TEMA NAS CONFIGURAÇÕES ---
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  });
}

// Iniciar na tela de login (removendo a tela de carregamento)
window.addEventListener("load", () => {
    // Verificar se há um token na URL (para redefinição de senha)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // Se houver token na URL, ir para a tela de redefinição
        resetToken = token;
        switchScreen(loginScreen, resetPasswordScreen);
        // O backend não precisa de validação aqui, pois o token é usado na rota de reset
    } else {
        // Verificar se o usuário já está logado
        checkLoginOnLoad();
        
        // Carregar login salvo
        const savedLogin = localStorage.getItem("rememberedLogin");
        if (savedLogin) {
            loginIdentifierInput.value = savedLogin;
            rememberMeCheckbox.checked = true;
        }
    }
});
// A validação do token de reset será feita diretamente na rota de reset-password do backend.
// A função validateResetToken não é mais necessária, pois o token é passado via URL.

// --- Lógica de Troca entre Telas de Registro, Login e Esqueci a Senha ---
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
  switchScreen(forgotPasswordScreen, loginScreen);
});

document.getElementById("switch-to-login-from-reset").addEventListener("click", (e) => {
  e.preventDefault();
  switchScreen(resetPasswordScreen, loginScreen);
});

// --- Lógica de Registro ---
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  // Validação básica
  if (password !== confirmPassword) {
    showError(errorMessage, "As senhas não coincidem!");
    return;
  }

  if (password.length < 6) {
    showError(errorMessage, "A senha deve ter pelo menos 6 caracteres!");
    return;
  }

  // Desabilitar botão durante o envio
  const submitButton = registerForm.querySelector("button[type=\"submit\"]");
  submitButton.disabled = true;
  submitButton.textContent = "Registrando...";

  try {
    // Enviar dados para o backend
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // O backend retorna 'message' em caso de erro
      throw new Error(data.message || "Erro ao registrar");
    }

    // Login bem-sucedido: Salvar dados e token no localStorage
    const userData = {
      _id: data._id,
      username: data.username,
      email: data.email,
      token: data.token, // Salvar o token JWT
    };
    localStorage.setItem("cardYXSUser", JSON.stringify(userData));

    // Ir para tela de boas-vindas
    switchScreen(registerScreen, welcomeScreen);
    
    // Carregar dados do perfil
    loadProfileData();
    
    // Ativar a página Home e o link de navegação
    pages.forEach(page => page.classList.remove("active"));
    homePage.classList.add("active");
    navLinks.forEach(l => l.classList.remove("active"));
    document.getElementById("nav-home").classList.add("active");
    
  } catch (error) {
    console.error("Erro no registro:", error);
    showError(errorMessage, error.message || "Erro ao registrar. Tente novamente.");
    submitButton.disabled = false;
    submitButton.textContent = "Registrar";
  }
});

// --- Lógica de Login ---
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const loginIdentifier = loginIdentifierInput.value.trim();
  const loginPassword = document.getElementById("login-password").value;

  // Lógica do "Lembrar"
  if (rememberMeCheckbox.checked) {
    localStorage.setItem("rememberedLogin", loginIdentifier);
  } else {
    localStorage.removeItem("rememberedLogin");
  }

  // Validação básica
  if (!loginIdentifier || !loginPassword) {
    showError(loginErrorMessage, "Todos os campos são obrigatórios!");
    return;
  }

  // Desabilitar botão durante o envio
  const submitButton = loginForm.querySelector("button[type=\"submit\"]");
  submitButton.disabled = true;
  submitButton.textContent = "Entrando...";

  try {
    // Enviar dados para o backend
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: loginIdentifier, // O backend aceita email ou username como identificador
        password: loginPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao fazer login");
    }

    // Login bem-sucedido: Salvar dados e token no localStorage
    const userData = {
      _id: data._id,
      username: data.username,
      email: data.email,
      token: data.token, // Salvar o token JWT
    };
    localStorage.setItem("cardYXSUser", JSON.stringify(userData));
    
    // Login bem-sucedido
    currentUser = userData;
    switchScreen(loginScreen, welcomeScreen);
    
    // Carregar dados do perfil
    loadProfileData();
    
    // Ativar a página Home e o link de navegação
    pages.forEach(page => page.classList.remove("active"));
    homePage.classList.add("active");
    navLinks.forEach(l => l.classList.remove("active"));
    document.getElementById("nav-home").classList.add("active");
    
    // Resetar formulário
    loginForm.reset();
    
  } catch (error) {
    console.error("Erro no login:", error);
    showError(loginErrorMessage, error.message || "Erro ao entrar. Tente novamente.");
    submitButton.disabled = false;
    submitButton.textContent = "Entrar";
  }
});

// --- Lógica de "Esqueci a Senha" ---
forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("forgot-password-email").value.trim();
    
    if (!email) {
        showError(forgotPasswordMessage, "Por favor, insira seu e-mail.");
        return;
    }

    const submitButton = forgotPasswordForm.querySelector("button[type=\"submit\"]");
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    try {
        // Chamada real para a rota do backend
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

        // Sucesso: Exibe a mensagem real de envio
        forgotPasswordMessage.classList.remove("error-message");
        forgotPasswordMessage.classList.add("success-message");
        forgotPasswordMessage.textContent = data.message || `Um link de recuperação foi enviado para ${email}. Verifique sua caixa de entrada.`;
        forgotPasswordMessage.classList.add("show");

        // Oculta o botão de envio para evitar múltiplos cliques
        submitButton.style.display = 'none';

    } catch (error) {
        console.error("Erro na recuperação de senha:", error);
        showError(forgotPasswordMessage, error.message || "Erro ao solicitar recuperação. Tente novamente.");
        submitButton.disabled = false;
        submitButton.textContent = "Enviar Link";
    }
});

// --- Lógica de Redefinição de Senha ---
resetPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("reset-email").value.trim();
    const newPassword = document.getElementById("reset-new-password").value;
    const confirmPassword = document.getElementById("reset-confirm-password").value;

    // Validação básica
    if (newPassword !== confirmPassword) {
        showError(resetPasswordMessage, "As senhas não coincidem!");
        return;
    }

    if (newPassword.length < 6) {
        showError(resetPasswordMessage, "A senha deve ter pelo menos 6 caracteres!");
        return;
    }

    // Desabilitar botão durante o envio
    const submitButton = resetPasswordForm.querySelector("button[type=\"submit\"]");
    submitButton.disabled = true;
    submitButton.textContent = "Redefinindo...";

    try {
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: resetToken,
                email: email,
                newPassword: newPassword,
                confirmPassword: confirmPassword,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erro ao redefinir senha");
        }

        // Sucesso: Exibe mensagem de sucesso
        resetPasswordMessage.classList.remove("error-message");
        resetPasswordMessage.classList.add("success-message");
        resetPasswordMessage.textContent = "Senha redefinida com sucesso! Redirecionando para login...";
        resetPasswordMessage.classList.add("show");

        // Redirecionar para login após 2 segundos
        setTimeout(() => {
            resetToken = null;
            // Limpar a URL
            window.history.replaceState({}, document.title, window.location.pathname);
            switchScreen(resetPasswordScreen, loginScreen);
        }, 2000);

    } catch (error) {
        console.error("Erro ao redefinir senha:", error);
        showError(resetPasswordMessage, error.message || "Erro ao redefinir senha. Tente novamente.");
        submitButton.disabled = false;
        submitButton.textContent = "Redefinir Senha";
    }
});

// --- Lógica de Toggle de Senha ---
document.querySelectorAll(".toggle-password").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const targetId = toggle.getAttribute("data-target");
    const targetInput = document.getElementById(targetId);

    if (targetInput.type === "password") {
      targetInput.type = "text";
      toggle.classList.remove("fa-eye");
      toggle.classList.add("fa-eye-slash");
    } else {
      targetInput.type = "password";
      toggle.classList.remove("fa-eye-slash");
      toggle.classList.add("fa-eye");
    }
  });
});

// --- Função de Erro ---
function showError(element, message) {
  element.textContent = message;
  element.classList.remove("success-message");
  element.classList.add("error-message");
  element.classList.add("show");
  element.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    element.classList.remove("show");
  }, 5000);
}
