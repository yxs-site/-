const express = require('express');
require('dotenv').config({ path: './.env' }); // Carrega as variáveis de ambiente no início
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('./emailService'); // Importa os serviços de e-mail

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do LowDB (Banco de Dados JSON)
const file = path.join(__dirname, 'users.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, { users: [] });

// Função para inicializar o banco de dados
async function initializeDB() {
  await db.read();
  if (!db.data.users) {
    db.data.users = [];
    await db.write();
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rota de registro
app.post('/api/register', async (req, res) => {
  await initializeDB();
  try {
    const { username, email, password } = req.body;

    // Validação básica
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Verificar se o e-mail já existe
    const existingUser = db.data.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    // Inserir usuário no "banco de dados" JSON
    const newUser = {
      id: Date.now(), // ID simples baseado em timestamp
      username,
      email,
      password, // Em um projeto real, a senha deve ser hasheada!
      created_at: new Date().toISOString()
    };

    db.data.users.push(newUser);
    await db.write();

    // Enviar e-mail de boas-vindas (sem esperar a conclusão)
    sendWelcomeEmail(email, username);

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      userId: newUser.id
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Rota de solicitação de recuperação de senha
app.post('/api/forgot-password', async (req, res) => {
  await initializeDB();
  try {
    const { email } = req.body;

    // 1. Encontrar o usuário pelo e-mail
    const user = db.data.users.find(u => u.email === email);

    if (!user) {
      // Por segurança, sempre retorne uma mensagem genérica, mesmo que o e-mail não exista
      return res.status(200).json({ message: 'Se o e-mail estiver cadastrado, um link de recuperação será enviado.' });
    }

    // 2. Gerar um token de recuperação
    const recoveryToken = Buffer.from(user.id.toString() + Date.now()).toString("base64");
    console.log(`Token de recuperação gerado: ${recoveryToken}`);

    // 3. Salvar o token e o tempo de expiração no registro do usuário
    user.resetToken = recoveryToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hora
    await db.write();

    // 4. Enviar o e-mail
    const emailSent = await sendPasswordResetEmail(user.email, recoveryToken);

    if (emailSent) {
      res.status(200).json({ message: 'Se o e-mail estiver cadastrado, um link de recuperação será enviado.' });
    } else {
      // Se o envio falhar (ex: credenciais erradas), retorne um erro interno
      res.status(500).json({ error: 'Erro ao tentar enviar o e-mail de recuperação.' });
    }

  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Rota para validar token de redefinição de senha
app.post('/api/validate-reset-token', async (req, res) => {
  await initializeDB();
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token é obrigatório' });
    }

    // Encontrar usuário com o token válido
    const user = db.data.users.find(u => 
      u.resetToken === token && 
      u.resetTokenExpiry && 
      u.resetTokenExpiry > Date.now()
    );

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    res.status(200).json({ 
      message: 'Token válido',
      email: user.email 
    });

  } catch (error) {
    console.error('Erro ao validar token:', error);
    res.status(500).json({ error: 'Erro ao validar token' });
  }
});

// Rota para redefinir senha
app.post('/api/reset-password', async (req, res) => {
  await initializeDB();
  try {
    const { token, email, newPassword, confirmPassword } = req.body;

    // Validação básica
    if (!token || !email || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Encontrar usuário com o token válido
    const user = db.data.users.find(u => 
      u.resetToken === token && 
      u.email === email &&
      u.resetTokenExpiry && 
      u.resetTokenExpiry > Date.now()
    );

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Atualizar senha
    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await db.write();

    res.status(200).json({ message: 'Senha redefinida com sucesso!' });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

// Rota para listar todos os usuários (para administração)
app.get('/api/users', async (req, res) => {
  await initializeDB();
  try {
    // Retorna os usuários sem a senha
    const users = db.data.users.map(user => {
      const { password, resetToken, resetTokenExpiry, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// A rota app.get('*') deve ser a última para não interceptar as rotas de API.
// A rota de registro (app.post('/api/register')) e outras rotas de API já estão definidas acima.

// Rota catch-all para requisições POST de API não mapeadas
app.post('/api/*', (req, res) => {
  res.status(404).json({ error: 'API POST endpoint not found' });
});

// Servir o frontend (catch-all para rotas não-API)
app.get('*', (req, res) => {
  // Apenas serve o index.html se a requisição não for para uma API
  if (req.path.startsWith('/api')) {
    // Se for uma requisição de API GET não mapeada, retorna 404
    return res.status(404).json({ error: 'API GET endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar servidor
initializeDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Banco de dados: ${path.join(__dirname, 'users.json')}`);
    console.log(`\n✅ Tudo pronto! Acesse o site no navegador.\n`);
  });
});
