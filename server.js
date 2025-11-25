require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB Atlas com sucesso!'))
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB Atlas:', err.message);
        process.exit(1); // Encerra a aplicação em caso de erro de conexão
    });

// Servir arquivos estáticos do frontend (a pasta 'public')
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de API (serão adicionadas em breve)
// Rotas de API
app.use('/api/auth', require('./routes/authRoutes'));

// Rota de fallback para o frontend (SPA - Single Page Application)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o Servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
