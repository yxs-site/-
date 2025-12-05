/**
 * Script para gerenciar exibição de estatísticas no perfil do usuário
 */

(function() {
    'use strict';

    // ========================================
    // Funções Utilitárias
    // ========================================

    /**
     * Atualizar exibição das estatísticas no perfil
     */
    function updateProfileStats() {
        const userStats = window.getUserStats ? window.getUserStats() : null;

        if (!userStats) {
            console.warn('Estatísticas do usuário não disponíveis');
            return;
        }

        // Atualizar Caça-Palavras
        const cacaScoreElement = document.getElementById('profile-caca-score');
        if (cacaScoreElement) {
            cacaScoreElement.textContent = (userStats.cacaPalavrasScore || 0).toLocaleString('pt-BR');
        }

        // Atualizar Jogo da Velha - Vitórias
        const winsElement = document.getElementById('profile-tictactoe-wins');
        if (winsElement) {
            winsElement.textContent = (userStats.tictactoeWins || 0).toLocaleString('pt-BR');
        }

        // Atualizar Jogo da Velha - Derrotas
        const lossesElement = document.getElementById('profile-tictactoe-losses');
        if (lossesElement) {
            lossesElement.textContent = (userStats.tictactoeLosses || 0).toLocaleString('pt-BR');
        }

        // Atualizar Jogo da Velha - Empates
        const tiesElement = document.getElementById('profile-tictactoe-ties');
        if (tiesElement) {
            tiesElement.textContent = (userStats.tictactoeTies || 0).toLocaleString('pt-BR');
        }

        // Atualizar Total de Jogos
        const totalGamesElement = document.getElementById('profile-total-games');
        if (totalGamesElement) {
            totalGamesElement.textContent = (userStats.totalGamesPlayed || 0).toLocaleString('pt-BR');
        }

        // Atualizar Melhor Sequência
        const bestStreakElement = document.getElementById('profile-best-streak');
        if (bestStreakElement) {
            bestStreakElement.textContent = (userStats.bestStreak || 0).toLocaleString('pt-BR');
        }
    }

    /**
     * Observar mudanças nas estatísticas
     */
    function observeStatsChanges() {
        // Atualizar quando a página de perfil for ativada
        const perfilPage = document.getElementById('perfil-page');
        if (perfilPage) {
            // Usar MutationObserver para detectar quando a página fica visível
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
                        // Verificar se a página está visível
                        const isVisible = perfilPage.classList.contains('active') || 
                                        perfilPage.style.display !== 'none';
                        
                        if (isVisible) {
                            // Pequeno delay para garantir que os dados estão prontos
                            setTimeout(updateProfileStats, 100);
                        }
                    }
                });
            });

            observer.observe(perfilPage, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }

        // Atualizar quando o nav-perfil for clicado
        const navPerfil = document.getElementById('nav-perfil');
        if (navPerfil) {
            navPerfil.addEventListener('click', function() {
                setTimeout(updateProfileStats, 100);
            });
        }
    }

    /**
     * Inicializar script de estatísticas do perfil
     */
    function initProfileStats() {
        // Atualizar estatísticas quando a página carregar
        updateProfileStats();

        // Observar mudanças
        observeStatsChanges();

        // Atualizar a cada 30 segundos
        setInterval(updateProfileStats, 30000);

        // Atualizar quando as estatísticas globais forem atualizadas
        if (window.addEventListener) {
            window.addEventListener('stats-updated', updateProfileStats);
        }
    }

    // ========================================
    // Inicialização
    // ========================================

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProfileStats);
    } else {
        initProfileStats();
    }

    // Expor função para atualização manual
    window.updateProfileStatsDisplay = updateProfileStats;
})();
