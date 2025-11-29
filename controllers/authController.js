const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendWelcomeEmail, sendResetConfirmationEmail } = require('../utils/emailService');

// Registrar novo usuário
exports.register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    console.log(`[REGISTRO] Tentativa de registro: ${email} / ${username}`);

    // Validar campos obrigatórios
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Validar se as senhas coincidem
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem' });
    }

    // Validar comprimento da senha
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Usuário ou e-mail já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar novo usuário
    const newUser = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date()
    });

    await newUser.save();
    console.log(`[REGISTRO] Usuário salvo com sucesso: ${newUser.email}`);

    // Enviar e-mail de boas-vindas em background (não bloqueia a resposta)
    sendWelcomeEmail(newUser).catch(err => {
      console.error('✗ Erro ao enviar e-mail de boas-vindas:', err.message);
    });

    // Gerar token JWT
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      token: token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
        // Tratamento de erro mais específico
    if (error.code === 11000) { // Erro de chave duplicada do MongoDB (e-mail ou username já existem)
      return res.status(400).json({ error: 'Usuário ou e-mail já cadastrado' });
    }
    console.error('✗ Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro interno ao registrar usuário' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validar campos obrigatórios
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Usuário/E-mail e senha são obrigatórios' });
    }

    // Buscar usuário por username ou email
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✓ Login bem-sucedido:', identifier);

    res.json({
      message: 'Login bem-sucedido!',
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture || null
      }
    });
  } catch (error) {
    console.error('✗ Erro ao fazer login:', error.message);
    // Em caso de erro interno, retornar 500, mas manter o 401 para credenciais inválidas
    res.status(500).json({ error: 'Erro interno ao fazer login' });
  }
};

// Solicitar recuperação de senha
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validar campo obrigatório
    if (!email) {
      return res.status(400).json({ error: 'E-mail é obrigatório' });
    }

    // Buscar usuário
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Alteração solicitada pelo usuário: retornar erro se o e-mail não for encontrado
      return res.status(404).json({ error: 'E-mail não cadastrado' });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 1 hora

    // Salvar token hash no banco de dados
    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Construir link de reset
    const clientURL = process.env.CLIENT_URL || 'https://yxs-site.onrender.com';
    const resetLink = `${clientURL}/#/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    console.log('✓ Token de reset gerado para:', email);

    // Enviar e-mail em background (não bloqueia a resposta)
    sendPasswordResetEmail(user, resetLink).catch(err => {
      console.error('✗ Erro ao enviar e-mail de recuperação:', err.message);
    });

    // Responder imediatamente ao usuário
    res.json({ message: 'Se o e-mail existir, um link de recuperação será enviado' });
  } catch (error) {
    console.error('✗ Erro ao solicitar recuperação de senha:', error.message);
    res.status(500).json({ error: 'Erro ao solicitar recuperação de senha' });
  }
};

// Redefinir senha
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword, confirmPassword } = req.body;

    // Validar campos obrigatórios
    if (!token || !email || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Validar se as senhas coincidem
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem' });
    }

    // Validar comprimento da senha
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Hash do token para comparação
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuário com token válido
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetToken: tokenHash,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha e limpar token de reset
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    console.log('✓ Senha redefinida para:', email);

    // Enviar e-mail de confirmação em background
    sendResetConfirmationEmail(user).catch(err => {
      console.error('✗ Erro ao enviar e-mail de confirmação:', err.message);
    });

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error('✗ Erro ao redefinir senha:', error.message);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
};

// Obter dados do usuário
exports.getUser = async (req, res) => {
  try {
    const userId = req.user._id; // CORREÇÃO: O middleware anexa o objeto User completo

    const user = await User.findById(userId).select('-password -resetToken -resetTokenExpiry');

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('✗ Erro ao obter dados do usuário:', error.message);
    res.status(500).json({ error: 'Erro ao obter dados do usuário' });
  }
};

// Atualizar perfil do usuário
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // CORREÇÃO: O middleware anexa o objeto User completo
    const { name, profilePicture } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, profilePicture },
      { new: true }
    ).select('-password -resetToken -resetTokenExpiry');

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    console.log('✓ Perfil atualizado para:', userId);

    res.json({ message: 'Perfil atualizado com sucesso!', user });
  } catch (error) {
    console.error('✗ Erro ao atualizar perfil:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

// Alterar senha
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id; // CORREÇÃO: O middleware anexa o objeto User completo
    console.log(`[ALTERAR SENHA] Tentativa de alteração de senha para userId: ${userId}`);
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validar campos obrigatórios
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Validar se as senhas coincidem
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem' });
    }

    // Validar comprimento da senha
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Buscar usuário
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    console.log(`[ALTERAR SENHA] Verificando senha atual para userId: ${userId}`);
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      console.log(`[ALTERAR SENHA] Falha: Senha atual incorreta para userId: ${userId}`);
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    console.log(`[ALTERAR SENHA] Senha hasheada com sucesso para userId: ${userId}`);
    user.password = hashedPassword;
    await user.save();
    console.log(`[ALTERAR SENHA] Senha salva no DB para userId: ${userId}`);

    console.log('✓ Senha alterada para:', userId);

    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error('✗ Erro ao alterar senha:', error.message);
    // Adicionar log detalhado para o erro
    console.log(error);
    // Se o erro for de validação (400) ou autenticação (401), já foi retornado.
    // Caso contrário, é um erro interno (500).
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro interno ao alterar senha' });
    }
  }
};

// Excluir conta
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id; // CORREÇÃO: O middleware anexa o objeto User completo
    const { password } = req.body;

    // Validar campo obrigatório
    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória para excluir a conta' });
    }

    // Buscar usuário
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Excluir usuário
    await User.findByIdAndDelete(userId);

    console.log('✓ Conta excluída:', userId);

    res.json({ message: 'Conta excluída com sucesso!' });
  } catch (error) {
    console.error('✗ Erro ao excluir conta:', error.message);
    res.status(500).json({ error: 'Erro ao excluir conta' });
  }
};


                                      

// Atualizar foto de perfil
exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profilePicture } = req.body;

    // Validar se a foto foi fornecida
    if (!profilePicture) {
      return res.status(400).json({ error: 'Foto de perfil não fornecida' });
    }

    // Validar se é uma string base64 válida
    if (typeof profilePicture !== 'string' || !profilePicture.startsWith('data:image')) {
      return res.status(400).json({ error: 'Formato de imagem inválido' });
    }

    // Atualizar o usuário com a nova foto de perfil
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePicture },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    console.log('✓ Foto de perfil atualizada:', userId);

    res.json({
      message: 'Foto de perfil atualizada com sucesso!',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture
      }
    });
  } catch (error) {
    console.error('✗ Erro ao atualizar foto de perfil:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar foto de perfil' });
  }
};
  
