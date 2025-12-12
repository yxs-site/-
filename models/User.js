const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: '' // URL da foto de perfil
    },
    // Campos de Pontuação e Estatísticas
    cacaPalavrasScore: {
        type: Number,
        default: 0 // Pontuação total do Caça-Palavras
    },
    tictactoeWins: {
        type: Number,
        default: 0 // Vitórias no Jogo da Velha
    },
    tictactoeLosses: {
        type: Number,
        default: 0 // Derrotas no Jogo da Velha
    },
    tictactoeTies: {
        type: Number,
        default: 0 // Empates no Jogo da Velha
    },
    totalGamesPlayed: {
        type: Number,
        default: 0 // Total de jogos jogados
    },
    currentStreak: {
        type: Number,
        default: 0 // Sequência atual de vitórias
    },
    bestStreak: {
        type: Number,
        default: 0 // Melhor sequência de vitórias
    },
    // Campo para recuperação de senha
    resetToken: String,
    resetTokenExpiry: Date,
    // Campos para amizade e chat
    friends: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            addedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    blockedUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
}, {
    timestamps: true // Adiciona createdAt e updatedAt
});

module.exports = mongoose.model('User', UserSchema);
