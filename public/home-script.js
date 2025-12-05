/**
 * Script para integração da página inicial melhorada
 * Gerencia carregamento de estatísticas e interações com os jogos
 */

(function() {
    'use strict';

    // ========================================
    // Configurações e Constantes
    // ========================================
    const API_URL = '';
    const CACHE_KEY = 'yxs_user_stats';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

    // ========================================
    // Estado Global
    // ========================================
    let userStats = null;
    let lastStatsUpdate = 0;

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
     * Carregar estatísticas do usuário
     */
    async function loadUserStats() {
        try {
            // Verificar cache
            const cached = localStorage.getItem(CACHE_KEY);
            const cachedTime = localStorage.getItem(CACHE_KEY + '_time');
            
            if (cached && cachedTime) {
                const age = Date.now() - parseInt(cachedTime);
                if (age < CACHE_DURATION) {
                    userStats = JSON.parse(cached);
                    updateStatsDisplay();
                    return;
                }
            }

            // Buscar do servidor
            const stats = await fetchWithAuth(`${API_URL}/api/scores/user-stats`);
            userStats = stats;
            lastStatsUpdate = Date.now();

            // Armazenar em cache
            localStorage.setItem(CACHE_KEY, JSON.stringify(stats));
            localStorage.setItem(CACHE_KEY + '_time', Date.now().toString());

            updateStatsDisplay();
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            // Usar valores padrão em caso de erro
            userStats = {
                cacaPalavrasScore: 0,
                totalGamesPlayed: 0,
                currentStreak: 0
            };
            updateStatsDisplay();
        }
    }

    /**
     * Atualizar exibição das estatísticas na página
     */
    function updateStatsDisplay() {
        if (!userStats) return;

        // Atualizar pontuação total
        const totalScoreElement = document.getElementById('total-score-display');
        if (totalScoreElement) {
            totalScoreElement.textContent = (userStats.cacaPalavrasScore || 0).toLocaleString('pt-BR');
        }

        // Atualizar total de jogos
        const gamesPlayedElement = document.getElementById('games-played-display');
        if (gamesPlayedElement) {
            gamesPlayedElement.textContent = (userStats.totalGamesPlayed || 0).toLocaleString('pt-BR');
        }

        // Atualizar sequência
        const streakElement = document.getElementById('streak-display');
        if (streakElement) {
            streakElement.textContent = (userStats.currentStreak || 0).toLocaleString('pt-BR');
        }
    }

    /**
     * Atualizar pontuação do Caça-Palavras
     */
    async function updateCacaPalavrasScore(score) {
        try {
            const result = await fetchWithAuth(`${API_URL}/api/scores/update-caca-palavras-score`, {
                method: 'POST',
                body: JSON.stringify({ score })
            });

            // Limpar cache para forçar atualização
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_KEY + '_time');

            // Recarregar estatísticas
            await loadUserStats();

            return result;
        } catch (error) {
            console.error('Erro ao atualizar pontuação:', error);
            throw error;
        }
    }

    /**
     * Atualizar resultado do Jogo da Velha
     */
    async function updateTictactoeResult(result) {
        try {
            const response = await fetchWithAuth(`${API_URL}/api/scores/update-tictactoe-result`, {
                method: 'POST',
                body: JSON.stringify({ result })
            });

            // Limpar cache para forçar atualização
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_KEY + '_time');

            // Recarregar estatísticas
            await loadUserStats();

            return response;
        } catch (error) {
            console.error('Erro ao atualizar resultado:', error);
            throw error;
        }
    }

    /**
     * Inicializar página inicial melhorada
     */
    function initHomeImproved() {
        // Carregar estatísticas ao iniciar
        loadUserStats();

        // Atualizar estatísticas a cada 30 segundos
        setInterval(loadUserStats, 30000);

        // Configurar botão do Caça-Palavras na home
        const btnCacaPalavrasHome = document.getElementById('btn-open-cacapalavras-home');
        if (btnCacaPalavrasHome) {
            btnCacaPalavrasHome.addEventListener('click', function(e) {
                e.preventDefault();
                // Abrir Caça-Palavras em nova aba ou modal
                window.open('caca-palavras.html', '_blank');
            });
        }

        // Configurar botão do Jogo da Velha
        const tictactoeCard = document.querySelector('.tictactoe-showcase a');
        if (tictactoeCard) {
            tictactoeCard.addEventListener('click', function(e) {
                // Deixar o comportamento padrão (navegação)
            });
        }
    }

    /**
     * Integrar com o Caça-Palavras
     * Deve ser chamado após o usuário terminar um jogo
     */
    window.submitCacaPalavrasScore = async function(score) {
        try {
            await updateCacaPalavrasScore(score);
            console.log('Pontuação do Caça-Palavras atualizada com sucesso!');
        } catch (error) {
            console.error('Erro ao submeter pontuação:', error);
        }
    };

    /**
     * Integrar com o Jogo da Velha
     * Deve ser chamado após o fim de um jogo
     */
    window.submitTictactoeResult = async function(result) {
        try {
            await updateTictactoeResult(result);
            console.log('Resultado do Jogo da Velha registrado com sucesso!');
        } catch (error) {
            console.error('Erro ao registrar resultado:', error);
        }
    };

    /**
     * Obter estatísticas do usuário (para uso externo)
     */
    window.getUserStats = function() {
        return userStats;
    };

    /**
     * Recarregar estatísticas manualmente
     */
    window.reloadUserStats = function() {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_KEY + '_time');
        return loadUserStats();
    };

    // ========================================
    // Inicialização
    // ========================================

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomeImproved);
    } else {
        initHomeImproved();
    }
})();
