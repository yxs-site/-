const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, htmlContent) => {
    try {
        // 1. Criar o transportador (transporter)
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            // Apenas a porta 465 é segura (SSL/TLS). 587 usa STARTTLS (secure: false)
            secure: process.env.EMAIL_PORT == 465,
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
            html: htmlContent, // Usar HTML ao invés de texto plano
            text: htmlContent.replace(/<[^>]*>/g, ''), // Fallback para texto plano (remove tags HTML)
        };

        // 3. Enviar o e-mail
        const info = await transporter.sendMail(mailOptions);
        console.log('✓ E-mail enviado com sucesso. ID:', info.messageId);
        return info;

    } catch (error) {
        console.error('✗ Erro ao enviar e-mail:', error.message);
        // Em um ambiente de produção, você pode querer relançar o erro ou registrá-lo
        throw new Error('Falha no envio do e-mail: ' + error.message);
    }
};

module.exports = sendEmail;
