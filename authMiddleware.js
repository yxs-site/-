const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Verificar se o token está presente no cabeçalho Authorization
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Obter o token do cabeçalho
            token = req.headers.authorization.split(' ')[1];

            // Verificar o token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Anexar o usuário ao objeto de requisição (sem a senha)
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Não autorizado, token falhou.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Não autorizado, nenhum token.' });
    }
};

module.exports = protect;
