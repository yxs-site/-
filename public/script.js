
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
  const welcomeSplash = $('welcome-splash') || null;
  const btnEntrar = $('btn-entrar') || null;
  const splashMenuToggle = $('splash-menu-toggle') || null;
  const splashSidebarMenu = $('splash-sidebar-menu') || null;
  const splashCloseMenu = $('splash-close-menu') || null;
  const splashNavEntrar = $('splash-nav-entrar') || null;
  const splashNavRegistrar = $('splash-nav-registrar') || null;
  const splashNavModoClaro = $('splash-nav-modo-claro') || null;
  const splashNavModoEscuro = $('splash-nav-modo-escuro') || null;
  const loginMenuToggle = $('login-menu-toggle') || null;
  const loginSidebarMenu = $('login-sidebar-menu') || null;
  const loginCloseMenu = $('login-close-menu') || null;
  const registerMenuToggle = $('register-menu-toggle') || null;
  const registerSidebarMenu = $('register-sidebar-menu') || null;
  const registerCloseMenu = $('register-close-menu') || null;
  const forgotMenuToggle = $('forgot-menu-toggle') || null;
  const forgotSidebarMenu = $('forgot-sidebar-menu') || null;
  const forgotCloseMenu = $('forgot-close-menu') || null;
  const resetMenuToggle = $('reset-menu-toggle') || null;
  const resetSidebarMenu = $('reset-sidebar-menu') || null;
  const resetCloseMenu = $('reset-close-menu') || null;

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

    // Lógica para alternar o texto do link de tema
    const nextThemeText = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
    // Seleciona todos os links de alternância de tema nos menus laterais
    const themeToggles = document.querySelectorAll('.splash-sidebar-nav a[id$="-nav-theme-toggle"]');
    themeToggles.forEach(toggle => {
        toggle.textContent = nextThemeText;
    });

    if (themeToggle) {
      themeToggle.classList.toggle('active', theme === 'dark');
    }
  }

  // Inicializa o tema e garante que o texto do link de alternância esteja correto
  (function initTheme(){
    const saved = (() => {
      try { return localStorage.getItem('theme'); } catch (e) { return null; }
    })();
    // Garante que o tema inicial seja aplicado e o texto do link seja atualizado
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
      const profilePlaceholder = $('profile-placeholder');
      if (profileImg && profilePictureUrl) {
        profileImg.src = profilePictureUrl;
        profileImg.style.display = 'block';
        if (profilePlaceholder) profilePlaceholder.style.display = 'none';
        try { localStorage.setItem('profileImg', profilePictureUrl); } catch (e) {}
      } else if (profileImg && !profilePictureUrl) {
        profileImg.style.display = 'none';
        if (profilePlaceholder) profilePlaceholder.style.display = 'flex';
      }

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

  // Inicialização: Ativa a página Home se o usuário estiver logado
  (function initApp() {
    loadProfileData(); // Carrega dados do perfil e verifica login

    // Se o usuário estiver logado (currentUser foi preenchido em loadProfileData)
    if (currentUser) {
        // Ativa a página Home e o link de navegação Home
        pages.forEach(page => page.classList.remove('active'));
        if (homePage) homePage.classList.add('active');
        navLinks.forEach(l => l.classList.remove('active'));
        const navHome = $('nav-home'); if (navHome) navHome.classList.add('active');
    }
  })();

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
      const res = await fetch(`${API_URL}/api/auth/update-profile-picture`, {
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
		        if (link.id === 'nav-sair') { logout(); return; } // Corrigido para nav-sair
	        navLinks.forEach(l => l.classList.remove('active'));
	        link.classList.add('active');
	
	        pages.forEach(page => page.classList.remove('active'));
		        let pageId = link.id.replace('nav-', '') + '-page';
		        // Exceção para o link de Sair, que não tem uma página correspondente
		        if (link.id === 'nav-sair') {
		            pageId = null;
		        }
		        const page = document.getElementById(pageId);
		        if (page) page.classList.add('active');
		        if (pageId === 'perfil-page') {
		          loadProfileData();
		        }
	        if (sidebarMenu) sidebarMenu.classList.remove('active');
	        if (menuOverlay) menuOverlay.classList.remove('active');
	      });
	    });
	  }

  // Profile picture input - abre o modal de corte
  // Variavel global para armazenar a instancia do Cropper
  let cropperInstance = null;
  safe(profilePicInput, el => {
    el.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imgData = ev.target.result;
        const cropImageEl = $('crop-image');
        if (cropImageEl) {
          cropImageEl.src = imgData;
          // Inicializar Cropper se nao estiver ja inicializado
          if (cropperInstance) {
            cropperInstance.destroy();
          }
          // Aguardar a imagem carregar antes de inicializar o Cropper
          cropImageEl.onload = () => {
            cropperInstance = new Cropper(cropImageEl, {
              aspectRatio: 1,
              viewMode: 1,
              autoCropArea: 1,
              responsive: true,
              restore: true,
              guides: true,
              center: true,
              highlight: true,
              cropBoxMovable: true,
              cropBoxResizable: true,
              toggleDragModeOnDblclick: true,
            });
          };
          const modalCropFoto = $('modal-crop-foto');
          if (modalCropFoto) modalCropFoto.classList.add('active');
        }
      };
      reader.readAsDataURL(file);
    });
  });


  // Handlers para os botões de corte de foto
  const btnZoomIn = $('btn-zoom-in');
  const btnZoomOut = $('btn-zoom-out');
  const btnRotateLeft = $('btn-rotate-left');
  const btnRotateRight = $('btn-rotate-right');
  const btnResetCrop = $('btn-reset-crop');
  const btnSalvarCrop = $('btn-salvar-crop');
  const btnCancelarCrop = $('btn-cancelar-crop');
  const modalCropFoto = $('modal-crop-foto');
  const profileMessage = $('profile-message');

  safe(btnZoomIn, el => {
    el.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.zoom(0.1);
    });
  });

  safe(btnZoomOut, el => {
    el.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.zoom(-0.1);
    });
  });

  safe(btnRotateLeft, el => {
    el.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.rotate(-45);
    });
  });

  safe(btnRotateRight, el => {
    el.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.rotate(45);
    });
  });

  safe(btnResetCrop, el => {
    el.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.reset();
    });
  });

  safe(btnSalvarCrop, el => {
    el.addEventListener('click', () => {
      if (!cropperInstance) return;
      const canvas = cropperInstance.getCroppedCanvas({
        maxWidth: 4096,
        maxHeight: 4096,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
      if (profileImg) {
        profileImg.src = croppedImage;
        profileImg.style.display = 'block';
        const profilePlaceholder = $('profile-placeholder');
        if (profilePlaceholder) profilePlaceholder.style.display = 'none';
      }
      try { localStorage.setItem('profileImg', croppedImage); } catch (ex) {}
      saveProfilePicture(croppedImage);
      if (profileMessage) {
        profileMessage.textContent = 'Foto de perfil atualizada com sucesso!';
        profileMessage.className = 'profile-message success';
        profileMessage.style.display = 'block';
        setTimeout(() => {
          profileMessage.style.display = 'none';
        }, 3000);
      }
      if (modalCropFoto) modalCropFoto.classList.remove('active');
      if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
      }
    });
  });

  safe(btnCancelarCrop, el => {
    el.addEventListener('click', () => {
      if (modalCropFoto) modalCropFoto.classList.remove('active');
      if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
      }
      if (profilePicInput) profilePicInput.value = '';
    });
  });
  // Modal alterar senha
  safe(btnAlterarSenha, el => el.addEventListener('click', () => {
    if (modalAlterarSenha) modalAlterarSenha.classList.add('active');
  }));

  // Jogo da Velha - Lógica
  const socket = io(API_URL);
  let roomCode = null;
  let playerName = null;
  let playerSymbol = null;
  let playerColor = null;
  let currentTurn = null;
  let gameState = 'waiting';

  const tictactoeLobby = $('tictactoe-lobby');
  const tictactoeWaiting = $('tictactoe-waiting');
  const tictactoeDiceRoll = $('tictactoe-dice-roll');
  const tictactoeGame = $('tictactoe-game');
  const modalTictactoe = $('modal-tictactoe');
  const btnOpenTictactoe = $('btn-open-tictactoe');
  const btnCreateRoom = $('btn-create-room');
  const btnJoinRoomOpen = $('btn-join-room-open');
  const btnJoinRoom = $('btn-join-room');
  const roomCodeInput = $('room-code-input');
  const joinRoomForm = $('join-room-form');
  const waitingRoomCode = $('waiting-room-code');
  const lobbyMessage = $('lobby-message');
  const btnCancelWait = $('btn-cancel-wait');
  const btnRollDice = $('btn-roll-dice');
  const playerDice = $('player-dice');
  const opponentDice = $('opponent-dice');
  const diceMessage = $('dice-message');
  const gameStatus = $('game-status');
  const tictactoeBoard = document.querySelector('.tictactoe-board');
  const gameInfo = $('game-info');
  const btnPlayAgain = $('btn-play-again');
  const btnLeaveGame = $('btn-leave-game');

  // Novos elementos para a tela dedicada
  const tictactoePage = $('tictactoe-page');
  const playerSelfName = $('player-self-name');
  const playerOpponentName = $('player-opponent-name');
  const playerSelfSymbol = $('player-self-symbol');
  const playerOpponentSymbol = $('player-opponent-symbol');
  const playerSelfImg = $('player-self-img');
  const playerOpponentImg = $('player-opponent-img');

  function showGameSection(section) {
    document.querySelectorAll('.game-section').forEach(sec => sec.style.display = 'none');
    if (section) section.style.display = 'block';
  }

  function resetGame() {
    roomCode = null;
    playerSymbol = null;
    playerColor = null;
    currentTurn = null;
    gameState = 'waiting';
    
    // Limpar o tabuleiro
    if (tictactoeBoard) {
        tictactoeBoard.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
            cell.onclick = null;
        });
    }

    // Limpar dados do jogo
    if (playerDice) playerDice.textContent = '?';
    if (opponentDice) opponentDice.textContent = '?';
    if (diceMessage) diceMessage.textContent = '';
    if (gameInfo) gameInfo.textContent = '';
    if (btnPlayAgain) btnPlayAgain.style.display = 'none';

    // Limpar info dos jogadores
    if (playerSelfName) playerSelfName.textContent = 'Você';
    if (playerOpponentName) playerOpponentName.textContent = 'Oponente';
    if (playerSelfSymbol) playerSelfSymbol.textContent = '';
    if (playerOpponentSymbol) playerOpponentSymbol.textContent = '';
    if (playerSelfImg) playerSelfImg.src = '';
    if (playerOpponentImg) playerOpponentImg.src = '';

    // Voltar para o lobby
    if (tictactoeLobby) showGameSection(tictactoeLobby);
  }

  // 1. Abrir Jogo (Navegar para a tela dedicada)
  safe(btnOpenTictactoe, el => el.addEventListener('click', () => {
    // Navegar para a tela do Jogo da Velha
    pages.forEach(page => page.classList.remove('active'));
    if (tictactoePage) tictactoePage.classList.add('active');

    // Fechar menu lateral
    if (sidebarMenu) sidebarMenu.classList.remove('active');
    if (menuOverlay) menuOverlay.classList.remove('active');

    // Inicializar o jogo
    playerName = ($('profile-name') && $('profile-name').textContent) || 'Jogador';
    resetGame();
  }));

  // 2. Criar Sala
  safe(btnCreateRoom, el => el.addEventListener('click', () => {
    socket.emit('create-room', playerName);
    showGameSection(tictactoeWaiting);
  }));

  // 3. Abrir Formulário de Entrar
  safe(btnJoinRoomOpen, el => el.addEventListener('click', () => {
    if (joinRoomForm) joinRoomForm.style.display = 'flex';
  }));

  // 4. Entrar em Sala
  safe(btnJoinRoom, el => el.addEventListener('click', () => {
    const code = roomCodeInput.value.toUpperCase();
    if (code.length === 6) {
      roomCode = code; // Armazena o código da sala no frontend
      socket.emit('join-room', { roomCode: code, playerName });
      lobbyMessage.textContent = 'Tentando entrar...';
    } else {
      lobbyMessage.textContent = 'Código inválido (6 caracteres)';
    }
  }));

  // 5. Cancelar Espera
  safe(btnCancelWait, el => el.addEventListener('click', () => {
    socket.emit('leave-room');
    resetGame();
  }));

  // 6. Rolar Da  // 6. Rolar Dado (Apenas o jogador atual pode rolar)
  safe(btnRollDice, el => el.addEventListener('click', () => {
    // Apenas permite rolar se for o turno do jogador
    if (gameState === 'rolling' && currentTurn === socket.id) {
        socket.emit('roll-dice');
        diceMessage.textContent = 'Aguardando resultado...';
        btnRollDice.disabled = true; // Desabilita para evitar cliques múltiplos
    } else {
        diceMessage.textContent = 'Aguarde sua vez de rolar o dado.';
    }
  }));ltado...';
  }));

  // 7. Fazer Movimento
  if (tictactoeBoard) {
    tictactoeBoard.addEventListener('click', (e) => {
      if (e.target.classList.contains('cell') && gameState === 'playing' && socket.id === currentTurn) {
        const position = e.target.getAttribute('data-index');
        if (e.target.textContent === '') {
          socket.emit('make-move', { position: parseInt(position) });
        }
      }
    });
  }

  // 8. Jogar de Novo
  safe(btnPlayAgain, el => el.addEventListener('click', () => {
    socket.emit('play-again');
    btnPlayAgain.style.display = 'none';
  }));

  // 9. Sair do Jogo
  safe(btnLeaveGame, el => el.addEventListener('click', () => {
    socket.emit('leave-room');
    // Não precisa fechar modal, pois agora é uma página
    // Volta para a página de Jogos
    const gamesPage = $('games-page');
    if (gamesPage) {
        pages.forEach(page => page.classList.remove('active'));
        gamesPage.classList.add('active');
    }
    resetGame();
  }));

  // Socket Listeners
  socket.on('room-created', (data) => {
    roomCode = data.code;
    waitingRoomCode.textContent = roomCode;
    lobbyMessage.textContent = '';
    showGameSection(tictactoeWaiting);
  });

  socket.on('player-joined', (data) => {
    lobbyMessage.textContent = ''; 
    
    const players = data.players;
    const isCreator = players[0].id === socket.id;
    const self = isCreator ? players[0] : players[1];
    const opponent = isCreator ? players[1] : players[0];

    playerSymbol = self.symbol;
    playerColor = self.color;
    
    // Atualiza as informações dos jogadores na tela
    if (playerSelfName) playerSelfName.textContent = self.name;
    if (playerOpponentName) playerOpponentName.textContent = opponent.name;
    if (playerSelfSymbol) playerSelfSymbol.textContent = `(${self.symbol})`;
    if (playerOpponentSymbol) playerOpponentSymbol.textContent = `(${opponent.symbol})`;
    
    // TODO: Adicionar lógica para carregar foto de perfil do oponente

    showGameSection(tictactoeDiceRoll);
    diceMessage.textContent = `Seu oponente é ${opponent.name}. Role o dado para começar!`;
    
    // Apenas o criador da sala (que é o primeiro a entrar) pode rolar o dado
    // A lógica de quem rola primeiro será definida no backend.
    // Aqui, apenas o jogador que está na vez de rolar pode clicar.
    // No caso de 'player-joined', o estado é 'rolling', e o turno é de quem criou a sala.
    // O backend precisa informar quem rola primeiro.
    // Por enquanto, vamos deixar o botão habilitado para o criador.
    // O backend deve garantir que apenas o criador possa rolar.
    btnRollDice.disabled = false;
  });

  socket.on('dice-rolled', (data) => {
    // Atualiza os dados rolados
    playerDice.textContent = data.player1Dice;
    opponentDice.textContent = data.player2Dice;
    
    // Atualiza o símbolo e cor do jogador (se houve troca)
    const self = data.players.find(p => p.id === socket.id);
    const opponent = data.players.find(p => p.id !== socket.id);
    
    if (self) {
        playerSymbol = self.symbol;
        playerColor = self.color;
        if (playerSelfSymbol) playerSelfSymbol.textContent = `(${playerSymbol})`;
        if (playerOpponentSymbol) playerOpponentSymbol.textContent = `(${opponent.symbol})`;
    }

    // Define a mensagem de status
    if (data.starter === playerName) {
      gameStatus.textContent = 'Você começa! Seu Turno.';
      gameInfo.textContent = `Você é o ${playerSymbol} (${playerColor}).`;
    } else {
      gameStatus.textContent = `${data.starter} começa. Aguarde seu turno.`;
      gameInfo.textContent = `Você é o ${playerSymbol} (${playerColor}).`;
    }
    
    // Transiciona para a tela de jogo
    setTimeout(() => {
      showGameSection(tictactoeGame);
      currentTurn = data.currentTurn;
      gameState = data.gameState;
    }, 2000);
  });

  socket.on('board-updated', (data) => {
    data.board.forEach((symbol, index) => {
      const cell = tictactoeBoard.querySelector(`[data-index="${index}"]`);
      if (cell && symbol) {
        cell.textContent = symbol;
        cell.classList.add(symbol);
      }
    });
    currentTurn = data.currentTurn;
    if (currentTurn === socket.id) {
      gameStatus.textContent = 'Seu Turno.';
    } else {
      gameStatus.textContent = `Turno de ${data.currentPlayerName}.`;
    }
  });

  socket.on('game-finished', (data) => {
    gameState = 'finished';
    btnPlayAgain.style.display = 'block';
    if (data.winner === 'draw') {
      gameStatus.textContent = 'Empate!';
    } else if (data.winner === playerName) {
      gameStatus.textContent = 'Você Venceu!';
    } else {
      gameStatus.textContent = `${data.winner} Venceu!`;
    }
    data.board.forEach((symbol, index) => {
      const cell = tictactoeBoard.querySelector(`[data-index="${index}"]`);
      if (cell && symbol) {
        cell.textContent = symbol;
        cell.classList.add(symbol);
      }
    });
  });

  socket.on('game-reset', (data) => {
    resetGame();
    showGameSection(tictactoeDiceRoll);
    diceMessage.textContent = 'O jogo foi resetado. Role o dado novamente!';
    btnRollDice.disabled = false;
  });

  socket.on('player-left', (data) => {
    // Exibe a mensagem de que o jogador saiu e volta para a tela de Jogos em 5 segundos
    gameStatus.textContent = `${data.playerName} saiu da sala. Voltando para a tela de Jogos em 5 segundos...`;
    gameInfo.textContent = 'O jogo terminou.';
    btnPlayAgain.style.display = 'none';
    
    setTimeout(() => {
        // Volta para a página de Jogos
        const gamesPage = $('games-page');
        if (gamesPage) {
            pages.forEach(page => page.classList.remove('active'));
            gamesPage.classList.add('active');
        }
        resetGame();
    }, 5000);
  });

  socket.on('error', (data) => {
    lobbyMessage.textContent = data.message;
    setTimeout(() => {
      lobbyMessage.textContent = '';
    }, 3000);
  });
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

  // Initially hide login screen if splash is active
  if (welcomeSplash && welcomeSplash.classList.contains('active')) {
    if (loginScreen) loginScreen.classList.remove('active');
  }

  // Welcome Splash Button Handler
  safe(btnEntrar, el => {
    el.addEventListener('click', () => {
      if (welcomeSplash && loginScreen) {
        switchScreen(welcomeSplash, loginScreen);
      }
    });
  });

  // Splash Menu Toggle Handler
  safe(splashMenuToggle, el => {
    el.addEventListener('click', () => {
      if (splashSidebarMenu) splashSidebarMenu.classList.add('active');
    });
  });

  // Splash Close Menu Handler
  safe(splashCloseMenu, el => {
    el.addEventListener('click', () => {
      if (splashSidebarMenu) splashSidebarMenu.classList.remove('active');
    });
  });

  // Splash Nav Entrar
  safe(splashNavEntrar, el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (splashSidebarMenu) splashSidebarMenu.classList.remove('active');
      if (welcomeSplash && loginScreen) {
        switchScreen(welcomeSplash, loginScreen);
      }
    });
  });

  // Splash Nav Registrar
  safe(splashNavRegistrar, el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (splashSidebarMenu) splashSidebarMenu.classList.remove('active');
      if (welcomeSplash && registerScreen) {
        switchScreen(welcomeSplash, registerScreen);
      }
    });
  });

  // Splash Nav Theme Toggle
  safe($('splash-nav-theme-toggle'), el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const current = body && body.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      if (splashSidebarMenu) splashSidebarMenu.classList.remove('active');
    });
  });

  // Close splash sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (splashSidebarMenu && splashMenuToggle) {
      const isClickInsideSidebar = splashSidebarMenu.contains(e.target);
      const isClickOnToggle = splashMenuToggle.contains(e.target);
      if (!isClickInsideSidebar && !isClickOnToggle && splashSidebarMenu.classList.contains('active')) {
        splashSidebarMenu.classList.remove('active');
      }
    }
  });

  // Generic function to setup menu for any screen
  function setupScreenMenu(menuToggle, sidebarMenu, closeMenu, navHome, navEntrar, navRegistrar, navModoClaro, navModoEscuro, fromScreen, toLoginScreen, toRegisterScreen) {
    safe(menuToggle, el => {
      el.addEventListener('click', () => {
        if (sidebarMenu) sidebarMenu.classList.add('active');
      });
    });

    safe(closeMenu, el => {
      el.addEventListener('click', () => {
        if (sidebarMenu) sidebarMenu.classList.remove('active');
      });
    });

    safe(navHome, el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (sidebarMenu) sidebarMenu.classList.remove('active');
        // O welcomeSplash é a tela inicial com o gif
        if (fromScreen && welcomeSplash) switchScreen(fromScreen, welcomeSplash);
      });
    });

    safe(navEntrar, el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (sidebarMenu) sidebarMenu.classList.remove('active');
        if (fromScreen && toLoginScreen) switchScreen(fromScreen, toLoginScreen);
      });
    });

    safe(navRegistrar, el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (sidebarMenu) sidebarMenu.classList.remove('active');
        if (fromScreen && toRegisterScreen) switchScreen(fromScreen, toRegisterScreen);
      });
    });

    // Novo manipulador de evento para o link de alternância de tema
    safe(navModoClaro, el => { // navModoClaro agora é o ID do novo link de alternância
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const current = body && body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        if (sidebarMenu) sidebarMenu.classList.remove('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (sidebarMenu && menuToggle) {
        const isClickInsideSidebar = sidebarMenu.contains(e.target);
        const isClickOnToggle = menuToggle.contains(e.target);
        if (!isClickInsideSidebar && !isClickOnToggle && sidebarMenu.classList.contains('active')) {
          sidebarMenu.classList.remove('active');
        }
      }
    });
  }

  // Setup menus for all screens
  // Setup menus for all screens
  // O último argumento (navModoEscuro) não é mais necessário, mas a função setupScreenMenu espera 9 argumentos.
  // navModoClaro agora é o ID do novo link de alternância.
  setupScreenMenu(loginMenuToggle, loginSidebarMenu, loginCloseMenu, $('login-nav-home'), $('login-nav-entrar'), $('login-nav-registrar'), $('login-nav-theme-toggle'), null, loginScreen, loginScreen, registerScreen);
  setupScreenMenu(registerMenuToggle, registerSidebarMenu, registerCloseMenu, $('register-nav-home'), $('register-nav-entrar'), $('register-nav-registrar'), $('register-nav-theme-toggle'), null, registerScreen, loginScreen, registerScreen);
  setupScreenMenu(forgotMenuToggle, forgotSidebarMenu, forgotCloseMenu, $('forgot-nav-home'), $('forgot-nav-entrar'), $('forgot-nav-registrar'), $('forgot-nav-theme-toggle'), null, forgotPasswordScreen, loginScreen, registerScreen);
  setupScreenMenu(resetMenuToggle, resetSidebarMenu, resetCloseMenu, $('reset-nav-home'), $('reset-nav-entrar'), $('reset-nav-registrar'), $('reset-nav-theme-toggle'), null, resetPasswordScreen, loginScreen, registerScreen);

  // Parse URL (reset) and check login on load
  document.addEventListener('DOMContentLoaded', () => {
    const isReset = parseResetURL();
    if (!isReset) {
      // Check if user is logged in
      let stored = null;
      try {
        stored = JSON.parse(localStorage.getItem('cardYXSUser'));
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

  // Export for debugging (optional)
  window.__App = {
    logout,
    loadProfileData,
    applyTheme,
  };

})();
