const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    try {
        // 1. Criar o transportador (transporter)
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT == 465, // true para 465, false para outras portas (como 587)
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 2. Definir as opções do e-mail
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: to,
            subject: subject,
            text: text,
            // Você pode adicionar html: '<h1>Conteúdo HTML</h1>' se quiser um e-mail mais formatado
        };

        // 3. Enviar o e-mail
        const info = await transporter.sendMail(mailOptions);
        console.log('Mensagem enviada: %s', info.messageId);
        return info;

    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        // Em um ambiente de produção, você pode querer relançar o erro ou registrá-lo
        throw new Error('Falha no envio do e-mail.');
    }
};

module.exports = sendEmail;
