// chat-script.js
// Lógica de frontend para o sistema de chat em tempo real

(function () {
    'use strict';

    // Referências aos elementos do DOM
    const chatPage = document.getElementById('chat-page');
    const friendsList = document.getElementById('friends-list');
    const chatEmpty = document.getElementById('chat-empty');
    const chatWindow = document.getElementById('chat-window');
    const messagesArea = document.getElementById('messages-area');
    const messageInput = document.getElementById('message-input');
    const btnSendMessage = document.getElementById('btn-send-message');
    const btnAddFriend = document.getElementById('btn-add-friend');
    const searchUsersModal = document.getElementById('search-users-modal');
    const searchUsersInput = document.getElementById('search-users-input');
    const searchResults = document.getElementById('search-results');
    const btnCloseSearchModal = document.getElementById('btn-close-search-modal');
    const chatFriendName = document.getElementById('chat-friend-name');
    const chatFriendAvatar = document.getElementById('chat-friend-avatar');
    const btnCloseChat = document.getElementById('btn-close-chat');
    const searchFriendsInput = document.getElementById('search-friends');

    // Variáveis globais
    let currentUser = null;
    let currentFriend = null;
    let socket = null;
    let allFriends = [];

    // Inicializar Socket.io
    function initSocket() {
        socket = io();

        // Conectar o usuário ao socket
        socket.on('connect', () => {
            console.log('Conectado ao servidor de chat');
            const userId = localStorage.getItem('cardYXSUser');
            if (userId) {
                socket.emit('user-connected', userId);
            }
        });

        // Receber mensagens em tempo real
        socket.on('receive-message', (message) => {
            if (currentFriend && message.senderId === currentFriend._id) {
                displayMessage(message);
            }
        });

        // Marcar mensagem como lida
        socket.on('message-read', (data) => {
            // Atualizar UI se necessário
        });
    }

    // Obter o usuário atual do localStorage
    function getCurrentUser() {
        const userJSON = localStorage.getItem('cardYXSUser');
        if (userJSON) {
            try {
                currentUser = JSON.parse(userJSON);
            } catch (e) {
                currentUser = { _id: userJSON };
            }
        }
    }

    // Carregar lista de amigos
    async function loadFriends() {
        try {
            const response = await fetch('/api/chat/friends', {
                headers: {
                    'x-user-id': currentUser._id
                }
            });

            if (!response.ok) {
                console.error('Erro ao carregar amigos');
                return;
            }

            allFriends = await response.json();
            displayFriends(allFriends);
        } catch (error) {
            console.error('Erro ao carregar amigos:', error);
        }
    }

    // Exibir lista de amigos
    function displayFriends(friends) {
        friendsList.innerHTML = '';

        if (friends.length === 0) {
            friendsList.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--color-text-secondary);">Nenhum amigo ainda</p>';
            return;
        }

        friends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            friendElement.innerHTML = `
                <img src="${friend.userId.profilePicture || 'https://via.placeholder.com/50'}" alt="${friend.userId.username}" class="friend-avatar">
                <div class="friend-info">
                    <p class="friend-name">${friend.userId.username}</p>
                    <p class="friend-last-message">Clique para conversar</p>
                </div>
            `;

            friendElement.addEventListener('click', () => {
                selectFriend(friend.userId);
            });

            friendsList.appendChild(friendElement);
        });
    }

    // Selecionar um amigo para conversar
    async function selectFriend(friend) {
        currentFriend = friend;

        // Atualizar UI
        document.querySelectorAll('.friend-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');

        // Mostrar janela de chat
        chatEmpty.style.display = 'none';
        chatWindow.style.display = 'flex';

        // Atualizar header do chat
        chatFriendName.textContent = friend.username;
        chatFriendAvatar.src = friend.profilePicture || 'https://via.placeholder.com/50';

        // Carregar histórico de mensagens
        await loadMessages(friend._id);
    }

    // Carregar histórico de mensagens
    async function loadMessages(friendId) {
        try {
            const response = await fetch(`/api/chat/messages/${friendId}`, {
                headers: {
                    'x-user-id': currentUser._id
                }
            });

            if (!response.ok) {
                console.error('Erro ao carregar mensagens');
                return;
            }

            const messages = await response.json();
            messagesArea.innerHTML = '';

            messages.forEach(message => {
                displayMessage(message);
            });

            // Scroll para o final
            messagesArea.scrollTop = messagesArea.scrollHeight;
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
        }
    }

    // Exibir mensagem
    function displayMessage(message) {
        const messageElement = document.createElement('div');
        const isSent = message.senderId === currentUser._id;
        messageElement.className = `message ${isSent ? 'sent' : 'received'}`;

        const time = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageElement.innerHTML = `
            <div>
                <div class="message-bubble">${message.content}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        messagesArea.appendChild(messageElement);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // Enviar mensagem
    async function sendMessage() {
        const content = messageInput.value.trim();

        if (!content || !currentFriend) {
            return;
        }

        try {
            // Enviar via Socket.io para tempo real
            socket.emit('send-message', {
                senderId: currentUser._id,
                receiverId: currentFriend._id,
                content: content
            });

            // Limpar input
            messageInput.value = '';

            // Exibir mensagem localmente
            displayMessage({
                senderId: currentUser._id,
                receiverId: currentFriend._id,
                content: content,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    }

    // Pesquisar usuários
    async function searchUsers(query) {
        if (!query || query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/chat/search?query=${encodeURIComponent(query)}`, {
                headers: {
                    'x-user-id': currentUser._id
                }
            });

            if (!response.ok) {
                console.error('Erro ao pesquisar usuários');
                return;
            }

            const users = await response.json();
            displaySearchResults(users);
        } catch (error) {
            console.error('Erro ao pesquisar usuários:', error);
        }
    }

    // Exibir resultados da pesquisa
    function displaySearchResults(users) {
        searchResults.innerHTML = '';

        if (users.length === 0) {
            searchResults.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">Nenhum usuário encontrado</p>';
            return;
        }

        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-result';
            userElement.innerHTML = `
                <div class="user-result-info">
                    <img src="${user.profilePicture || 'https://via.placeholder.com/40'}" alt="${user.username}" class="user-result-avatar">
                    <p class="user-result-name">${user.username}</p>
                </div>
                <button class="btn-add-user">Adicionar</button>
            `;

            const btnAdd = userElement.querySelector('.btn-add-user');
            btnAdd.addEventListener('click', () => {
                addFriend(user._id);
            });

            searchResults.appendChild(userElement);
        });
    }

    // Adicionar amigo
    async function addFriend(friendId) {
        try {
            const response = await fetch('/api/chat/add-friend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser._id
                },
                body: JSON.stringify({ friendId })
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Erro ao adicionar amigo');
                return;
            }

            alert('Amigo adicionado com sucesso!');
            searchUsersInput.value = '';
            searchResults.innerHTML = '';
            loadFriends();
        } catch (error) {
            console.error('Erro ao adicionar amigo:', error);
            alert('Erro ao adicionar amigo');
        }
    }

    // Event Listeners
    btnSendMessage.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    btnAddFriend.addEventListener('click', () => {
        searchUsersModal.style.display = 'flex';
    });

    btnCloseSearchModal.addEventListener('click', () => {
        searchUsersModal.style.display = 'none';
    });

    btnCloseChat.addEventListener('click', () => {
        chatEmpty.style.display = 'flex';
        chatWindow.style.display = 'none';
        currentFriend = null;
    });

    searchUsersInput.addEventListener('input', (e) => {
        searchUsers(e.target.value);
    });

    searchFriendsInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allFriends.filter(friend =>
            friend.userId.username.toLowerCase().includes(query)
        );
        displayFriends(filtered);
    });

    // Fechar modal ao clicar fora
    searchUsersModal.addEventListener('click', (e) => {
        if (e.target === searchUsersModal) {
            searchUsersModal.style.display = 'none';
        }
    });

    // Inicializar quando a página carrega
    window.addEventListener('load', () => {
        getCurrentUser();
        if (currentUser) {
            initSocket();
            loadFriends();
        }
    });

    // Expor funções globalmente se necessário
    window.chatUtils = {
        loadFriends,
        sendMessage
    };
})();
