let io;
const userSockets = new Map(); // Mapeia userId para um Set de socket.id

const setSocketIO = (socketIO) => {
    io = socketIO;
};

const getSocketIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call setSocketIO first.");
    }
    return io;
};

const addUserSocket = (userId, socketId) => {
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socketId);
};

const removeUserSocket = (userId, socketId) => {
    if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socketId);
        if (userSockets.get(userId).size === 0) {
            userSockets.delete(userId);
        }
    }
};

const getUserSockets = (userId) => {
    return userSockets.get(userId) || new Set();
};

module.exports = { setSocketIO, getSocketIO, addUserSocket, removeUserSocket, getUserSockets };
