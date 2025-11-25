// Arquivo: server/emailService.js

const nodemailer = require('nodemailer');
// As variáveis de ambiente são carregadas no server/index.js

// Configuração do transportador (transporter) do Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Seu e-mail do Gmail
        pass: process.env.EMAIL_PASS  // Sua Senha de App do Google
    }
});

/**
 * Envia um e-mail de recuperação de senha.
 * @param {string} toEmail - O e-mail do destinatário.
 * @param {string} token - O token de recuperação de senha (geralmente um link único).
 */
async function sendPasswordResetEmail(toEmail, token) {
    // Em um ambiente real, você usaria o domínio do seu site em vez de localhost:3000
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    console.log(`Link de recuperação de senha: ${resetLink}`); 

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Recuperação de Senha - Card YXS',
        html: `
            <h2>Recuperação de Senha</h2>
            <p>Você solicitou a recuperação de senha para sua conta Card YXS.</p>
            <p>Clique no botão abaixo para redefinir sua senha:</p>
            <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">
                Alterar Senha
            </a>
            <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
            <p>O link expira em 1 hora.</p>
        `
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('E-mail de recuperação enviado: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Erro ao enviar e-mail de recuperação:', error.message); // Log mais detalhado
        return false;
    }
}

/**
 * Envia um e-mail de boas-vindas após o registro.
 * @param {string} toEmail - O e-mail do destinatário.
 * @param {string} username - O nome de usuário.
 */
async function sendWelcomeEmail(toEmail, username) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Bem-vindo(a) ao YXS Card!',
        html: `
            <h2>Bem-vindo(a), ${username}!</h2>
            <p>Sua conta no YXS Card foi criada com sucesso.</p>
            <p>Estamos felizes em ter você conosco. Você já pode fazer login e começar a usar o sistema.</p>
            <p>Se tiver qualquer dúvida, entre em contato com o suporte.</p>
            <br>
            <p>Atenciosamente,</p>
            <p>Equipe YXS Card</p>
        `
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('E-mail de boas-vindas enviado: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Erro ao enviar e-mail de boas-vindas:', error.message);
        return false;
    }
}

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };
