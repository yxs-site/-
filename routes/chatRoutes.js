const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');

// Middleware para verificar autenticação (você pode ajustar conforme sua implementação)
const authMiddleware = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    req.userId = userId;
    next();
};

// Pesquisar usuários por nome ou username
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.length < 2) {
            return res.status(400).json({ error: 'Query deve ter pelo menos 2 caracteres' });
        }

        // Buscar usuários que correspondem ao query (excluindo o usuário atual)
        const users = await User.find({
            $and: [
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } }
                    ]
                },
                { _id: { $ne: req.userId } }
            ]
        }).select('_id username profilePicture').limit(10);

        res.json(users);
    } catch (error) {
        console.error('Erro ao pesquisar usuários:', error);
        res.status(500).json({ error: 'Erro ao pesquisar usuários' });
    }
});

// Obter lista de amigos do usuário
router.get('/friends', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('friends.userId', '_id username profilePicture');
        
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(user.friends);
    } catch (error) {
        console.error('Erro ao obter amigos:', error);
        res.status(500).json({ error: 'Erro ao obter amigos' });
    }
});

// Adicionar amigo
router.post('/add-friend', authMiddleware, async (req, res) => {
    try {
        const { friendId } = req.body;

        if (!friendId) {
            return res.status(400).json({ error: 'friendId é obrigatório' });
        }

        // Verificar se o amigo existe
        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ error: 'Amigo não encontrado' });
        }

        // Obter o usuário atual
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verificar se já é amigo
        const alreadyFriend = user.friends.some(f => f.userId.toString() === friendId);
        if (alreadyFriend) {
            return res.status(400).json({ error: 'Já é amigo deste usuário' });
        }

        // Adicionar amigo
        user.friends.push({ userId: friendId });
        await user.save();

        // Adicionar o usuário como amigo do outro lado também (amizade bidirecional)
        friend.friends.push({ userId: req.userId });
        await friend.save();

        res.json({ message: 'Amigo adicionado com sucesso', friend: { _id: friendId, username: friend.username, profilePicture: friend.profilePicture } });
    } catch (error) {
        console.error('Erro ao adicionar amigo:', error);
        res.status(500).json({ error: 'Erro ao adicionar amigo' });
    }
});

// Remover amigo
router.post('/remove-friend', authMiddleware, async (req, res) => {
    try {
        const { friendId } = req.body;

        if (!friendId) {
            return res.status(400).json({ error: 'friendId é obrigatório' });
        }

        // Remover amigo do usuário atual
        const user = await User.findByIdAndUpdate(
            req.userId,
            { $pull: { friends: { userId: friendId } } },
            { new: true }
        );

        // Remover o usuário como amigo do outro lado
        await User.findByIdAndUpdate(
            friendId,
            { $pull: { friends: { userId: req.userId } } }
        );

        res.json({ message: 'Amigo removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover amigo:', error);
        res.status(500).json({ error: 'Erro ao remover amigo' });
    }
});

// Obter histórico de mensagens com um amigo
router.get('/messages/:friendId', authMiddleware, async (req, res) => {
    try {
        const { friendId } = req.params;

        // Buscar mensagens entre os dois usuários
        const messages = await Message.find({
            $or: [
                { senderId: req.userId, receiverId: friendId },
                { senderId: friendId, receiverId: req.userId }
            ]
        }).sort({ timestamp: 1 }).limit(50);

        // Marcar mensagens como lidas
        await Message.updateMany(
            { receiverId: req.userId, senderId: friendId, read: false },
            { read: true }
        );

        res.json(messages);
    } catch (error) {
        console.error('Erro ao obter mensagens:', error);
        res.status(500).json({ error: 'Erro ao obter mensagens' });
    }
});

// Salvar mensagem no banco de dados
router.post('/send-message', authMiddleware, async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        if (!receiverId || !content) {
            return res.status(400).json({ error: 'receiverId e content são obrigatórios' });
        }

        const message = new Message({
            senderId: req.userId,
            receiverId: receiverId,
            content: content
        });

        await message.save();

        res.json(message);
    } catch (error) {
        console.error('Erro ao salvar mensagem:', error);
        res.status(500).json({ error: 'Erro ao salvar mensagem' });
    }
});

module.exports = router;
