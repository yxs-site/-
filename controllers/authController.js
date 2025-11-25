const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/emailService');

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
        // 1. Validar campos obrigatórios
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        // 2. Verificar se o usuário já existe
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'Usuário com este e-mail ou nome de usuário já existe.' });
        }

        // 3. Criar novo usuário
        user = new User({
            username,
            email,
            password,
        });

        // 4. Hash da senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 5. Salvar no banco de dados
        await user.save();

        // 6. Enviar e-mail de boas-vindas (assíncrono, não bloqueia a resposta)
        const welcomeSubject = 'Bem-vindo(a) ao Card YXS!';
        const welcomeHTML = `
            <h2>Bem-vindo(a) ao Card YXS!</h2>
            <p>Olá ${username},</p>
            <p>Seu registro foi concluído com sucesso. Estamos felizes em tê-lo(a) a bordo!</p>
            <p>Aproveite o jogo e divirta-se!</p>
            <br>
            <p>Atenciosamente,<br>Equipe Card YXS</p>
        `;
        
        sendEmail(user.email, welcomeSubject, welcomeHTML)
            .then(() => console.log('✓ E-mail de boas-vindas enviado para:', user.email))
            .catch(err => console.error('✗ Erro ao enviar e-mail de boas-vindas:', err.message));

        // 7. Responder com sucesso e token
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
            message: 'Registro realizado com sucesso!'
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro no servidor durante o registro.' });
    }
};

// @desc    Autenticar usuário e obter token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Validar campos obrigatórios
        if (!email || !password) {
            return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
        }

        // 2. Verificar se o usuário existe
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // 3. Senha correta, responder com sucesso e token
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
                message: 'Login realizado com sucesso!'
            });
        } else {
            // 4. Credenciais inválidas
            res.status(401).json({ message: 'E-mail ou senha inválidos.' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
};

// @desc    Solicitar recuperação de senha
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Validar campo obrigatório
        if (!email) {
            return res.status(400).json({ message: 'E-mail é obrigatório.' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Responder com sucesso mesmo que o e-mail não exista para evitar enumeração de usuários
            return res.json({ message: 'Se um usuário com este e-mail for encontrado, um link de recuperação de senha será enviado.' });
        }

        // 2. Gerar token de recuperação
        const resetToken = crypto.randomBytes(20).toString('hex');

        // 3. Salvar o token hasheado e a data de expiração no usuário
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora de validade

        await user.save();

        // 4. Criar o link de recuperação
        // O Render fornecerá o host correto automaticamente
        const resetURL = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

        // 5. Enviar e-mail
        const emailSubject = 'Recuperação de Senha - Card YXS';
        const emailHTML = `
            <h2>Recuperação de Senha</h2>
            <p>Você solicitou a redefinição da sua senha no Card YXS.</p>
            <p><a href="${resetURL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir Senha</a></p>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p><code>${resetURL}</code></p>
            <p><strong>Atenção:</strong> Este link expira em 1 hora.</p>
            <p>Se você não solicitou isso, ignore este e-mail.</p>
        `;

        await sendEmail(user.email, emailSubject, emailHTML);

        res.json({ message: 'E-mail de recuperação de senha enviado com sucesso.' });

    } catch (error) {
        console.error('Erro ao solicitar recuperação de senha:', error);
        res.status(500).json({ message: 'Erro no servidor ao solicitar recuperação de senha.' });
    }
};

// @desc    Redefinir a senha
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // 1. Validar campos obrigatórios
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
        }

        // 2. Hash do token recebido para buscar no banco
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // 3. Buscar usuário pelo token e verificar validade
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() } // Verifica se o token não expirou
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        // 4. Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // 5. Limpar os campos de recuperação
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // 6. Salvar o usuário
        await user.save();

        // 7. Enviar e-mail de confirmação
        const confirmationSubject = 'Senha Redefinida com Sucesso';
        const confirmationHTML = `
            <h2>Senha Redefinida</h2>
            <p>Sua senha foi redefinida com sucesso!</p>
            <p>Você pode fazer login agora com sua nova senha.</p>
            <p>Se você não fez essa alteração, entre em contato conosco imediatamente.</p>
        `;

        sendEmail(user.email, confirmationSubject, confirmationHTML)
            .catch(err => console.error('Erro ao enviar confirmação de reset:', err.message));

        res.json({ message: 'Senha redefinida com sucesso. Você pode fazer login agora.' });

    } catch (error) {
        console.error('Erro ao redefinir a senha:', error);
        res.status(500).json({ message: 'Erro no servidor ao redefinir a senha.' });
    }
};

// @desc    Alterar a senha do usuário logado
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        // 1. Validar campos obrigatórios
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // 2. Verificar se a senha atual está correta
        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }

        // 3. Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // 4. Salvar o usuário
        await user.save();

        res.json({ message: 'Senha alterada com sucesso.' });

    } catch (error) {
        console.error('Erro ao alterar a senha:', error);
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
        console.error('Erro ao excluir a conta:', error);
        res.status(500).json({ message: 'Erro no servidor ao excluir a conta.' });
    }
};
