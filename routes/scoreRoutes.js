const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Obter dados de pontuação do usuário
router.get('/user-stats', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select(
            'username email cacaPalavrasScore tictactoeWins tictactoeLosses tictactoeTies totalGamesPlayed currentStreak bestStreak'
        );
        
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.json({
            username: user.username,
            email: user.email,
            cacaPalavrasScore: user.cacaPalavrasScore,
            tictactoeWins: user.tictactoeWins,
            tictactoeLosses: user.tictactoeLosses,
            tictactoeTies: user.tictactoeTies,
            totalGamesPlayed: user.totalGamesPlayed,
            currentStreak: user.currentStreak,
            bestStreak: user.bestStreak
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ message: 'Erro ao obter estatísticas' });
    }
});

// Atualizar pontuação do Caça-Palavras
router.post('/update-caca-palavras-score', authMiddleware, async (req, res) => {
    try {
        const { score } = req.body;

        if (typeof score !== 'number' || score < 0) {
            return res.status(400).json({ message: 'Pontuação inválida' });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $inc: { cacaPalavrasScore: score } },
            { new: true }
        ).select('cacaPalavrasScore');

        res.json({
            message: 'Pontuação atualizada com sucesso',
            newScore: user.cacaPalavrasScore
        });
    } catch (error) {
        console.error('Erro ao atualizar pontuação:', error);
        res.status(500).json({ message: 'Erro ao atualizar pontuação' });
    }
});

// Atualizar resultado do Jogo da Velha
router.post('/update-tictactoe-result', authMiddleware, async (req, res) => {
    try {
        const { result } = req.body; // 'win', 'loss', 'tie'

        if (!['win', 'loss', 'tie'].includes(result)) {
            return res.status(400).json({ message: 'Resultado inválido' });
        }

        const updateData = { $inc: { totalGamesPlayed: 1 } };

        if (result === 'win') {
            updateData.$inc.tictactoeWins = 1;
            updateData.$inc.currentStreak = 1;
        } else if (result === 'loss') {
            updateData.$inc.tictactoeLosses = 1;
            updateData.$inc.currentStreak = 0;
        } else if (result === 'tie') {
            updateData.$inc.tictactoeTies = 1;
            updateData.$inc.currentStreak = 0;
        }

        const user = await User.findById(req.userId);

        // Atualizar melhor sequência se necessário
        if (user.currentStreak + 1 > user.bestStreak) {
            updateData.$set = { bestStreak: user.currentStreak + 1 };
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            updateData,
            { new: true }
        ).select('tictactoeWins tictactoeLosses tictactoeTies totalGamesPlayed currentStreak bestStreak');

        res.json({
            message: 'Resultado registrado com sucesso',
            stats: {
                wins: updatedUser.tictactoeWins,
                losses: updatedUser.tictactoeLosses,
                ties: updatedUser.tictactoeTies,
                totalGamesPlayed: updatedUser.totalGamesPlayed,
                currentStreak: updatedUser.currentStreak,
                bestStreak: updatedUser.bestStreak
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar resultado:', error);
        res.status(500).json({ message: 'Erro ao atualizar resultado' });
    }
});

// Obter ranking global (top 10)
router.get('/ranking', async (req, res) => {
    try {
        const topUsers = await User.find()
            .select('username cacaPalavrasScore tictactoeWins totalGamesPlayed')
            .sort({ cacaPalavrasScore: -1 })
            .limit(10);

        res.json(topUsers);
    } catch (error) {
        console.error('Erro ao obter ranking:', error);
        res.status(500).json({ message: 'Erro ao obter ranking' });
    }
});

module.exports = router;
