const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/emailService'); // Serviço de e-mail a ser criado

// Função auxiliar para gerar token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Registrar novo usuário
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. Verificar se o usuário já existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Usuário com este e-mail já existe.' });
        }

        // 2. Criar novo usuário
        user = new User({
            username,
            email,
            password, // A senha será hasheada antes de salvar (veremos isso no middleware)
        });

        // 3. Hash da senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 4. Salvar no banco de dados
        await user.save();

        // 5. Enviar e-mail de boas-vindas (assíncrono)
        const welcomeSubject = 'Bem-vindo(a) ao Card YXS!';
        const welcomeText = `Olá ${username},\n\nSeu registro no Card YXS foi concluído com sucesso. Estamos felizes em tê-lo(a) a bordo!`;
        sendEmail(user.email, welcomeSubject, welcomeText)
            .then(() => console.log('E-mail de boas-vindas enviado para:', user.email))
            .catch(err => console.error('Erro ao enviar e-mail de boas-vindas:', err));

        // 6. Responder com sucesso e token
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor durante o registro.' });
    }
};

// @desc    Autenticar usuário e obter token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Verificar se o usuário existe
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // 2. Senha correta, responder com sucesso e token
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            // 3. Credenciais inválidas
            res.status(401).json({ message: 'E-mail ou senha inválidos.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
};

// @desc    Solicitar recuperação de senha
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // Responder com sucesso mesmo que o e-mail não exista para evitar enumeração de usuários
            return res.json({ message: 'Se um usuário com este e-mail for encontrado, um link de recuperação de senha será enviado.' });
        }

        // 1. Gerar token de recuperação
        const resetToken = crypto.randomBytes(20).toString('hex');

        // 2. Salvar o token hasheado e a data de expiração no usuário
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora de validade

        await user.save();

        // 3. Criar o link de recuperação (assumindo que o frontend terá uma rota /reset-password/:token)
        const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

        // 4. Enviar e-mail
        const emailSubject = 'Recuperação de Senha do Card YXS';
        const emailText = `Você está recebendo este e-mail porque você (ou alguém) solicitou a redefinição da senha da sua conta.\n\nPor favor, clique no link a seguir, ou cole-o no seu navegador para completar o processo:\n\n${resetURL}\n\nSe você não solicitou isso, por favor, ignore este e-mail e sua senha permanecerá inalterada. O link expira em 1 hora.`;

        await sendEmail(user.email, emailSubject, emailText);

        res.json({ message: 'E-mail de recuperação de senha enviado.' });

    } catch (error) {
        console.error(error);
        // Limpar os campos de token em caso de falha no envio do e-mail
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(500).json({ message: 'Erro no servidor ao solicitar recuperação de senha.' });
    }
};

// @desc    Redefinir a senha
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    // 1. Hash do token recebido para buscar no banco
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    try {
        // 2. Buscar usuário pelo token e verificar validade
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() } // Verifica se o token não expirou
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        // 3. Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // 4. Limpar os campos de recuperação
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // 5. Salvar o usuário
        await user.save();

        res.json({ message: 'Senha redefinida com sucesso. Você pode fazer login agora.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor ao redefinir a senha.' });
    }
};

// @desc    Alterar a senha do usuário logado
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // 1. Verificar se a senha atual está correta
        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }

        // 2. Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // 3. Salvar o usuário
        await user.save();

        res.json({ message: 'Senha alterada com sucesso.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor ao alterar a senha.' });
    }
};

// @desc    Excluir a conta do usuário logado
// @route   DELETE /api/auth/delete-account
// @access  Private
exports.deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        await user.deleteOne();

        res.json({ message: 'Conta excluída com sucesso.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor ao excluir a conta.' });
    }
};
    const { token, newPassword } = req.body;

    // 1. Hash do token recebido para buscar no banco
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    try {
        // 2. Buscar usuário pelo token e verificar validade
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() } // Verifica se o token não expirou
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        // 3. Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // 4. Limpar os campos de recuperação
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // 5. Salvar o usuário
        await user.save();

        res.json({ message: 'Senha redefinida com sucesso. Você pode fazer login agora.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor ao redefinir a senha.' });
    }
};
