const fetch = require('node-fetch');

// Função principal para enviar e-mail usando a API do Brevo
exports.sendEmail = async (options) => {
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

    if (!BREVO_API_KEY) {
        console.error('✗ Erro: BREVO_API_KEY não está configurada.');
        throw new Error('Configuração de e-mail ausente. Por favor, configure a BREVO_API_KEY.');
    }

    // O endereço de e-mail do remetente será lido das variáveis de ambiente
    const senderEmail = process.env.EMAIL_FROM_ADDRESS || 'noreply@yxs-site.onrender.com';
    const senderName = process.env.EMAIL_FROM_NAME || 'Card YXS';

    const emailData = {
        sender: {
            name: options.fromName || senderName,
            email: options.fromEmail || senderEmail
        },
        to: [{
            email: options.email,
            name: options.name || options.email
        }],
        subject: options.subject,
        htmlContent: options.message,
    };

    try {
        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        if (response.ok) {
            console.log(`✓ E-mail enviado com sucesso para: ${options.email}`);
        } else {
            const errorData = await response.json();
            console.error(`✗ Erro ao enviar e-mail via Brevo API (Status: ${response.status}):`, errorData);
            // Incluir o corpo da resposta de erro para melhor diagnóstico
            throw new Error(`Falha no envio do e-mail: ${JSON.stringify(errorData)}`);
        }
    } catch (error) {
        console.error('✗ Erro ao enviar e-mail:', error.message);
        throw new Error(`Falha no envio do e-mail: ${error.message}`);
    }
};

// Função de wrapper para recuperação de senha
exports.sendPasswordResetEmail = async (user, resetURL) => {
    const subject = 'Redefinição de Senha - Card YXS';
    const message = `
        Olá ${user.username},
        
        Você solicitou a redefinição de sua senha. Por favor, clique no link abaixo para redefinir sua senha:
        
        <a href="${resetURL}">Redefinir Senha</a>
        
        Este link é válido por apenas 1 hora.
        
        Se você não solicitou isso, por favor, ignore este e-mail.
    `;

    await exports.sendEmail({
        email: user.email,
        name: user.username,
        subject: subject,
        message: message,
    });
};

// Função de wrapper para confirmação de redefinição de senha
exports.sendResetConfirmationEmail = async (user) => {
    const subject = 'Senha Redefinida com Sucesso - Card YXS';
    const message = `
        Olá ${user.username},
        
        Sua senha foi redefinida com sucesso.
        
        Se você não realizou esta ação, por favor, entre em contato com o suporte imediatamente.
    `;

    await exports.sendEmail({
        email: user.email,
        name: user.username,
        subject: subject,
        message: message,
    });
};

// Função de wrapper para e-mail de boas-vindas
exports.sendWelcomeEmail = async (user) => {
    const subject = 'Bem-vindo(a) ao Card YXS!';
    const message = `
        Olá ${user.username},
        
        Sua conta foi criada com sucesso. Bem-vindo(a) à comunidade Card YXS!
        
        Se precisar de ajuda, não hesite em nos contatar.
    `;

    await exports.sendEmail({
        email: user.email,
        name: user.username,
        subject: subject,
        message: message,
    });
};

