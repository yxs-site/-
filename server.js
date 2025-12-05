require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors'); // Adicionado: Importar o módulo cors
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: ['https://yxs-site.onrender.com', 'http://localhost:3000'],
        methods: ['GET', 'POST']
    }
});

// Armazenar salas e jogadores
const gameRooms = new Map();
const playerSockets = new Map();

// Middleware
// Configuração de CORS para permitir requisições do domínio do Render
const allowedOrigins = ['https://yxs-site.onrender.com', 'http://localhost:3000']; // Adicione outros domínios se necessário

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requisições sem 'origin' (como apps mobile ou curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'A política de CORS para este site não permite acesso a partir da origem especificada.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true // Permite cookies e cabeçalhos de autorização
}));
// Aumentar o limite de tamanho do corpo da requisição para permitir upload de fotos de perfil
app.use(express.json({ limit: '5mb' })); // Para parsear application/json (5MB)
app.use(express.urlencoded({ extended: true, limit: '5mb' })); // Para parsear application/x-www-form-urlencoded (5MB)

// Conexão com o MongoDB
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('Conectado ao MongoDB Atlas com sucesso!'))
        .catch(err => {
            console.error('Erro ao conectar ao MongoDB Atlas:', err.message);
            // Não encerra a aplicação, apenas registra o erro
        });
} else {
    console.warn('MONGO_URI não configurado. Continuando sem banco de dados.');
}

// Servir arquivos estáticos do frontend (a pasta 'public')
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de API (serão adicionadas em breve)
// Rotas de API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/scores', require('./routes/scoreRoutes'));

// Rota de fallback para o frontend (SPA - Single Page Application)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Exportar o app para ser usado em testes
module.exports = app;

// Socket.IO - Gerenciamento de Salas e Jogo da Velha
io.on('connection', (socket) => {
    console.log(`Novo jogador conectado: ${socket.id}`);

    // Criar uma nova sala
    socket.on('create-room', (playerName) => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = {
            code: roomCode,
            players: [{ id: socket.id, name: playerName, symbol: 'O', color: 'blue' }],
            board: ['', '', '', '', '', '', '', '', ''],
            currentTurn: null,
            gameState: 'waiting', // waiting, rolling, playing, finished
            winner: null
        };
        gameRooms.set(roomCode, room);
        playerSockets.set(socket.id, roomCode);
        socket.join(roomCode);
        socket.emit('room-created', { code: roomCode });
        console.log(`Sala criada: ${roomCode}`);
    });

    // Entrar em uma sala existente
    socket.on('join-room', (data) => {
        const { roomCode, playerName } = data;
        const room = gameRooms.get(roomCode);

        if (!room) {
            socket.emit('error', { message: 'Sala não encontrada' });
            return;
        }

        if (room.players.length >= 2) {
            socket.emit('error', { message: 'Sala cheia' });
            return;
        }

        room.players.push({ id: socket.id, name: playerName, symbol: 'X', color: 'red' });
        playerSockets.set(socket.id, roomCode);
        socket.join(roomCode);
        room.gameState = 'rolling';

	        // Emitir 'player-joined' para a sala inteira (agora com 2 jogadores)
	        io.to(roomCode).emit('player-joined', {
	            players: room.players,
	            gameState: room.gameState
	        });
        console.log(`Jogador ${playerName} entrou na sala ${roomCode}`);
    });

    // Rolar o dado para definir quem começa
    socket.on('roll-dice', () => {
        const roomCode = playerSockets.get(socket.id);
        const room = gameRooms.get(roomCode);

        if (!room || room.players.length < 2) return;

        const player1Dice = Math.floor(Math.random() * 6) + 1;
        const player2Dice = Math.floor(Math.random() * 6) + 1;

        let starterIndex = 0;
        if (player2Dice > player1Dice) {
            starterIndex = 1;
            // Trocar símbolos
            room.players[0].symbol = 'X';
            room.players[0].color = 'red';
            room.players[1].symbol = 'O';
            room.players[1].color = 'blue';
        }

        room.currentTurn = room.players[starterIndex].id;
        room.gameState = 'playing';

        io.to(roomCode).emit('dice-rolled', {
            player1Dice,
            player2Dice,
            starter: room.players[starterIndex].name,
            players: room.players,
            gameState: room.gameState
        });
        console.log(`Dado rolado na sala ${roomCode}: ${player1Dice} vs ${player2Dice}`);
    });

    // Fazer um movimento no jogo
    socket.on('make-move', (data) => {
        const { position } = data;
        const roomCode = playerSockets.get(socket.id);
        const room = gameRooms.get(roomCode);

        if (!room || room.currentTurn !== socket.id) return;

        const player = room.players.find(p => p.id === socket.id);
        room.board[position] = player.symbol;

	        // Verificar vitória
	        const winner = checkWinner(room.board);
	        if (winner) {
	            room.gameState = 'finished';
	            room.winner = player.name;
	            io.to(roomCode).emit('game-finished', {
	                winner: player.name,
	                board: room.board,
	                gameState: room.gameState
	            });
	        } else if (room.board.every(cell => cell !== '')) {
	            room.gameState = 'finished';
	            room.winner = 'draw';
	            io.to(roomCode).emit('game-finished', {
	                winner: 'draw',
	                board: room.board,
	                gameState: room.gameState
	            });
	        } else {
	            // Trocar turno
	            const otherPlayer = room.players.find(p => p.id !== socket.id);
	            room.currentTurn = otherPlayer.id;
	            io.to(roomCode).emit('board-updated', {
	                board: room.board,
	                currentTurn: room.currentTurn,
	                currentPlayerName: otherPlayer.name
	            });
	        }
    });

    // Jogar de novo
    socket.on('play-again', () => {
        const roomCode = playerSockets.get(socket.id);
        const room = gameRooms.get(roomCode);

        if (!room) return;

        room.board = ['', '', '', '', '', '', '', '', ''];
        room.gameState = 'rolling';
        room.winner = null;
        room.currentTurn = null;

        io.to(roomCode).emit('game-reset', {
            board: room.board,
            gameState: room.gameState
        });
    });

    // Sair da sala
    socket.on('leave-room', () => {
        const roomCode = playerSockets.get(socket.id);
        const room = gameRooms.get(roomCode);

        if (!room) return;

	        const player = room.players.find(p => p.id === socket.id);
	        // Notificar a sala que um jogador saiu
	        io.to(roomCode).emit('player-left', {
	            playerName: player.name
	        });
	
	        room.players = room.players.filter(p => p.id !== socket.id);
	        playerSockets.delete(socket.id);
	        socket.leave(roomCode);
	
	        if (room.players.length === 0) {
	            gameRooms.delete(roomCode);
	        }
	
	        console.log(`Jogador saiu da sala ${roomCode}`);
    });

    // Desconexão
    socket.on('disconnect', () => {
        const roomCode = playerSockets.get(socket.id);
        if (roomCode) {
            const room = gameRooms.get(roomCode);
            if (room) {
                const player = room.players.find(p => p.id === socket.id);
                if (player) {
                    io.to(roomCode).emit('player-left', {
                        playerName: player.name
                    });
                }
                room.players = room.players.filter(p => p.id !== socket.id);
                if (room.players.length === 0) {
                    gameRooms.delete(roomCode);
                }
            }
            playerSockets.delete(socket.id);
        }
        console.log(`Jogador desconectado: ${socket.id}`);
    });
});

// Função para verificar vencedor
function checkWinner(board) {
    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// Iniciar o Servidor apenas se o arquivo for executado diretamente
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}
