/**
 * Script de Integração da Foto de Perfil no Jogo da Velha
 * 
 * Este arquivo fornece funções para integrar a foto de perfil do usuário
 * no Jogo da Velha, exibindo as imagens dos jogadores no tabuleiro.
 */

(function() {
    'use strict';

    // ========================================
    // Configurações
    // ========================================
    const API_URL = '';

    // ========================================
    // Funções Utilitárias
    // ========================================

    /**
     * Obter token JWT do localStorage
     */
    function getAuthToken() {
        return localStorage.getItem('authToken');
    }

    /**
     * Fazer requisição autenticada
     */
    async function fetchWithAuth(url, options = {}) {
        const token = getAuthToken();
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    /**
     * Obter dados do usuário logado
     */
    async function getCurrentUserData() {
        try {
            const userData = await fetchWithAuth(`${API_URL}/api/auth/me`);
            return userData;
        } catch (error) {
            console.error('Erro ao obter dados do usuário:', error);
            return null;
        }
    }

    /**
     * Obter dados de um usuário específico pelo ID
     */
    async function getUserDataById(userId) {
        try {
            const userData = await fetchWithAuth(`${API_URL}/api/auth/user/${userId}`);
            return userData;
        } catch (error) {
            console.error('Erro ao obter dados do usuário:', error);
            return null;
        }
    }

    /**
     * Exibir foto de perfil no tabuleiro
     * @param {HTMLElement} cellElement - Elemento da célula onde exibir a foto
     * @param {string} profilePictureUrl - URL da foto de perfil
     * @param {string} playerSymbol - Símbolo do jogador ('X' ou 'O')
     */
    function displayProfilePictureInCell(cellElement, profilePictureUrl, playerSymbol) {
        if (!cellElement) return;

        // Limpar conteúdo anterior
        cellElement.innerHTML = '';

        if (profilePictureUrl) {
            // Criar container para a foto
            const imgContainer = document.createElement('div');
            imgContainer.className = 'profile-pic-container';
            imgContainer.style.cssText = `
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                overflow: hidden;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            `;

            // Criar imagem
            const img = document.createElement('img');
            img.src = profilePictureUrl;
            img.alt = `Foto do jogador ${playerSymbol}`;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 8px;
            `;

            imgContainer.appendChild(img);
            cellElement.appendChild(imgContainer);
        } else {
            // Mostrar símbolo padrão se não houver foto
            const symbolElement = document.createElement('div');
            symbolElement.className = 'player-symbol';
            symbolElement.textContent = playerSymbol;
            symbolElement.style.cssText = `
                font-size: 2.5rem;
                font-weight: bold;
                color: ${playerSymbol === 'X' ? '#667eea' : '#764ba2'};
            `;
            cellElement.appendChild(symbolElement);
        }
    }

    /**
     * Exibir foto de perfil no cabeçalho do jogador
     * @param {HTMLElement} playerInfoElement - Elemento de informação do jogador
     * @param {string} profilePictureUrl - URL da foto de perfil
     * @param {string} playerName - Nome do jogador
     */
    function displayPlayerProfilePicture(playerInfoElement, profilePictureUrl, playerName) {
        if (!playerInfoElement) return;

        const imgElement = playerInfoElement.querySelector('img');
        
        if (imgElement) {
            if (profilePictureUrl) {
                imgElement.src = profilePictureUrl;
                imgElement.style.display = 'block';
            } else {
                imgElement.style.display = 'none';
            }
        }
    }

    /**
     * Atualizar tabuleiro com fotos de perfil
     * @param {Object} boardState - Estado do tabuleiro
     * @param {Object} playerSelfData - Dados do jogador atual
     * @param {Object} playerOpponentData - Dados do oponente
     */
    function updateBoardWithProfilePictures(boardState, playerSelfData, playerOpponentData) {
        const cells = document.querySelectorAll('.tictactoe-board .cell');
        
        cells.forEach((cell, index) => {
            const cellValue = boardState[index];
            
            if (cellValue === 'X') {
                // Foto do jogador atual
                displayProfilePictureInCell(
                    cell,
                    playerSelfData?.profilePicture,
                    'X'
                );
            } else if (cellValue === 'O') {
                // Foto do oponente
                displayProfilePictureInCell(
                    cell,
                    playerOpponentData?.profilePicture,
                    'O'
                );
            } else {
                // Célula vazia
                cell.innerHTML = '';
            }
        });
    }

    /**
     * Atualizar cabeçalho dos jogadores com fotos de perfil
     * @param {Object} playerSelfData - Dados do jogador atual
     * @param {Object} playerOpponentData - Dados do oponente
     */
    function updatePlayerHeadersWithProfilePictures(playerSelfData, playerOpponentData) {
        const playerSelfInfo = document.getElementById('player-self-info');
        const playerOpponentInfo = document.getElementById('player-opponent-info');

        if (playerSelfInfo && playerSelfData) {
            displayPlayerProfilePicture(
                playerSelfInfo,
                playerSelfData.profilePicture,
                playerSelfData.username
            );
        }

        if (playerOpponentInfo && playerOpponentData) {
            displayPlayerProfilePicture(
                playerOpponentInfo,
                playerOpponentData.profilePicture,
                playerOpponentData.username
            );
        }
    }

    /**
     * Inicializar integração de fotos de perfil
     */
    async function initProfilePictureIntegration() {
        try {
            // Obter dados do usuário logado
            const currentUser = await getCurrentUserData();
            
            if (!currentUser) {
                console.warn('Usuário não autenticado');
                return;
            }

            // Armazenar dados do usuário para uso posterior
            window.currentUserProfileData = currentUser;

            // Atualizar cabeçalho do jogador atual
            const playerSelfInfo = document.getElementById('player-self-info');
            if (playerSelfInfo && currentUser.profilePicture) {
                displayPlayerProfilePicture(
                    playerSelfInfo,
                    currentUser.profilePicture,
                    currentUser.username
                );
            }

            console.log('Integração de fotos de perfil inicializada com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar integração de fotos:', error);
        }
    }

    /**
     * Atualizar foto do oponente quando conectar
     * @param {Object} opponentData - Dados do oponente
     */
    window.updateOpponentProfilePicture = function(opponentData) {
        const playerOpponentInfo = document.getElementById('player-opponent-info');
        
        if (playerOpponentInfo && opponentData) {
            displayPlayerProfilePicture(
                playerOpponentInfo,
                opponentData.profilePicture,
                opponentData.username
            );
        }
    };

    /**
     * Atualizar tabuleiro com fotos
     * @param {Array} boardState - Estado do tabuleiro [9 elementos]
     */
    window.updateBoardDisplay = function(boardState) {
        const playerSelfData = window.currentUserProfileData;
        const playerOpponentData = window.currentOpponentProfileData;

        if (playerSelfData && playerOpponentData) {
            updateBoardWithProfilePictures(boardState, playerSelfData, playerOpponentData);
        }
    };

    /**
     * Armazenar dados do oponente
     * @param {Object} opponentData - Dados do oponente
     */
    window.setOpponentProfileData = function(opponentData) {
        window.currentOpponentProfileData = opponentData;
    };

    // ========================================
    // Inicialização
    // ========================================

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProfilePictureIntegration);
    } else {
        initProfilePictureIntegration();
    }
})();
