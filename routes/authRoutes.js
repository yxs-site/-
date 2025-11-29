const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota de Registro
router.post('/register', authController.register);

// Rota de Login
router.post('/login', authController.login);

// Rota para solicitar recuperação de senha
router.post('/forgot-password', authController.forgotPassword);

// Rota para redefinir a senha
router.post('/reset-password', authController.resetPassword);

// Rota para alterar a senha (protegida)
router.post('/change-password', authMiddleware, authController.changePassword);

// Rota para excluir a conta (protegida)
router.delete('/delete-account', authMiddleware, authController.deleteAccount);

// Rota para atualizar a foto de perfil (protegida)
router.post('/update-profile-picture', authMiddleware, authController.updateProfilePicture);

module.exports = router;
