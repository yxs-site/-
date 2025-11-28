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
  // Garantir que a tela a ser mostrada esteja visível antes de remover a anterior
  showScreen.classList.add("active");
  hideScreen.classList.remove("active");
  // Opcional: Adicionar um pequeno delay para a transição de opacidade, se necessário
  // setTimeout(() => {
  //   showScreen.classList.add("active");
  // }, 500);
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
    // Os dados do usuário estão em storedUser.user
    updateProfileUI(storedUser.user);
    
    // Carregar foto de perfil do objeto de usuário (persistência do backend)
    const profilePictureUrl = storedUser.user.profilePicture;
    if (profilePictureUrl) {
      document.getElementById("profile-img").src = profilePictureUrl;
      // Manter no localStorage para carregamento rápido, mas a fonte de verdade é o objeto user
      localStorage.setItem("profileImg", profilePictureUrl); 
    } else {
      // Se não houver foto no objeto user, usar a padrão
      document.getElementById("profile-img").src = "caminho/para/foto/padrao.png"; 
      localStorage.removeItem("profileImg");
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

// Função para enviar a foto de perfil para o backend
async function saveProfilePicture(base64Image) {
    const storedUser = JSON.parse(localStorage.getItem("cardYXSUser"));
    
    if (!storedUser || !storedUser.token) {
        console.error("Usuário não autenticado. Não é possível salvar a foto.");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/auth/update-profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${storedUser.token}`
            },
            body: JSON.stringify({
                profilePicture: base64Image
            }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Erro ao salvar foto de perfil.");
        }
        
        console.log("Foto de perfil salva com sucesso no backend!");
        
        // Atualizar o objeto currentUser e localStorage com a nova URL/Base64
        storedUser.user.profilePicture = base64Image;
        localStorage.setItem("cardYXSUser", JSON.stringify(storedUser));
        currentUser = storedUser;
        
    } catch (error) {
        console.error("Erro ao salvar foto de perfil:", error.message);
        // Opcional: reverter a imagem no frontend para a anterior ou padrão
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
      
      // NOVO: Enviar a nova foto para o backend para persistência no banco de dados.
      saveProfilePicture(imgData);
    };
    reader.readAsDataURL(file);
  }
});

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
      const imgD      document.getElementById("profile-img").src = imgData;
      localStorage.setItem("profileImg", imgData);
      
      // NOVO: Enviar a nova foto para o backend para persistência no banco de dados.
      saveProfilePicture(imgData);
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

// CORREÇÃO: Garantir que o evento de clique esteja no elemento correto e que ele exista.
if (btnExcluirConta) {
  btnExcluirConta.addEventListener("click", () => {
    if (modalExcluirConta) {
      modalExcluirConta.classList.add("active");
    }
  });
}

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
    btnConfirmarExclusao.textContent = "Excluir Conta";
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
      // Se o status for 404 (e-mail não cadastrado), exibe a mensagem de erro do backend
      if (response.status === 404) {
        throw new Error(data.error || "E-mail não cadastrado.");
      }
      throw new Error(data.error || "Erro ao solicitar recuperação de senha.");
    }
    
    // Mostrar mensagem de sucesso
    forgotPasswordMessage.classList.remove("error-message");
    forgotPasswordMessage.classList.add("success-message");
    // Mensagem de sucesso
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
  
  // Validações
  if (newPassword !== confirmPassword) {
    showError(resetPasswordMessage, "As senhas não coincidem!");
    return;
  }
  
  if (newPassword.length < 6) {
    showError(resetPasswordMessage, "A nova senha deve ter pelo menos 6 caracteres!");
    return;
  }
  
  // Desabilitar botão
  const submitBtn = resetPasswordForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Redefinindo...";
  
  try {
    if (!resetToken) {
      throw new Error("Token de redefinição ausente. Tente novamente a recuperação de senha.");
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
      throw new Error(data.error || "Erro ao redefinir senha. Token inválido ou expirado.");
    }
    
    // Mostrar mensagem de sucesso
    resetPasswordMessage.classList.remove("error-message");
    resetPasswordMessage.classList.add("success-message");
    resetPasswordMessage.textContent = data.message || "Senha redefinida com sucesso! Você será redirecionado para o login.";
    resetPasswordMessage.classList.add("show");
    
    // Limpar formulário
    resetPasswordForm.reset();
    
    // Redirecionar para login após 3 segundos
    setTimeout(() => {
      switchScreen(resetPasswordScreen, loginScreen);
      resetPasswordMessage.classList.remove("show");
    }, 3000);
    
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
  const hash = window.location.hash;
  if (hash.startsWith('#/reset-password')) {
    // Extrair a parte dos parâmetros (depois do '?')
    const questionMarkIndex = hash.indexOf('?');
    if (questionMarkIndex !== -1) {
      const queryString = hash.substring(questionMarkIndex + 1);
      const urlParams = new URLSearchParams(queryString);
      const token = urlParams.get('token');
      const email = urlParams.get('email');
      
      if (token && email) {
        resetToken = token;
        document.getElementById("reset-email").value = decodeURIComponent(email);
        
        // Esconder todas as telas e mostrar apenas a de redefinição de senha
        document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
        resetPasswordScreen.classList.add("active");
        
        console.log('✓ Tela de reset de senha ativada com sucesso');
        console.log('Token:', token.substring(0, 10) + '...');
        console.log('Email:', email);
        
        // Retorna true para indicar que a tela de reset foi ativada
        return true;
      }
    }
  }
  return false;
}

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Verificar se há token de reset na URL
  const isResetScreen = parseResetURL();
  
  // 2. Se não estiver na tela de reset, verificar se o usuário já está logado no localStorage
  if (!isResetScreen) {
    checkLoginOnLoad();
  }
});

// --- LÓGICA DE PULL-TO-REFRESH ---
let pullStartY = 0;
let pullMoveY = 0;
let pullDistance = 0;
const PULL_THRESHOLD = 100; // Distância em pixels para acionar o refresh

document.addEventListener('touchstart', (e) => {
    // Apenas se estiver no topo da página (ou do elemento scrollável)
    if (window.scrollY === 0) {
        pullStartY = e.touches[0].screenY;
    }
});

document.addEventListener('touchmove', (e) => {
    if (pullStartY) {
        pullMoveY = e.touches[0].screenY;
        pullDistance = pullMoveY - pullStartY;

        // Se estiver puxando para baixo e a distância for positiva
        if (pullDistance > 0) {
            e.preventDefault(); // Previne o scroll padrão para dar a sensação de "puxar"
            // Poderia adicionar feedback visual aqui, mas para simplificar, vamos apenas detectar o gesto.
        }
    }
}, { passive: false }); // Usar passive: false para permitir preventDefault

document.addEventListener('touchend', () => {
    if (pullDistance > PULL_THRESHOLD) {
        // Aciona o refresh
        window.location.reload();
    }
    // Reseta as variáveis
    pullStartY = 0;
    pullMoveY = 0;
    pullDistance = 0;
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
