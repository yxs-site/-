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
    // Campo para recuperação de senha
    resetToken: String,
    resetTokenExpiry: Date
}, {
    timestamps: true // Adiciona createdAt e updatedAt
});

module.exports = mongoose.model('User', UserSchema);
