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
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <div style="background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; border-bottom: 5px solid #28a745;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Card YXS</h1>
            </div>
            
            <!-- Body -->
            <div style="padding: 30px; text-align: center;">
                <h2 style="color: #007bff; margin-top: 0;">Redefinição de Senha</h2>
                <p style="font-size: 16px;">Olá ${user.username},</p>
                <p style="font-size: 16px;">Recebemos uma solicitação para redefinir a senha da sua conta Card YXS.</p>
                
                <!-- Botão CTA -->
                <a href="${resetURL}" style="display: inline-block; background-color: #28a745; color: #ffffff; text-decoration: none; padding: 12px 25px; margin: 25px 0; border-radius: 5px; font-weight: bold; font-size: 16px;">
                    REDEFINIR MINHA SENHA
                </a>
                
                <p style="font-size: 14px; color: #777;">Este link é válido por apenas 1 hora.</p>
                <p style="font-size: 14px; color: #777;">Se você não solicitou esta redefinição, por favor, ignore este e-mail. Sua senha atual permanecerá inalterada.</p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f4f4f4; color: #999; padding: 15px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">Atenciosamente,</p>
                <p style="margin: 0;">A Equipe Card YXS</p>
            </div>
        </div>
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
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <!-- Header (Roxo) -->
            <div style="background-color: #8A2BE2; color: #ffffff; padding: 20px; text-align: center; border-bottom: 5px solid #28a745;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Card YXS</h1>
            </div>
            
            <!-- Body -->
            <div style="padding: 30px; text-align: center;">
                <h2 style="color: #28a745; margin-top: 0;">Sua conta foi criada com sucesso!</h2>
                <p style="font-size: 16px;">Olá ${user.username},</p>
                <p style="font-size: 16px;">É um prazer tê-lo(a) na comunidade Card YXS. Sua jornada conosco começa agora!</p>
                
                <!-- Botão CTA (Verde) -->
                <a href="https://yxs-site.onrender.com/login" style="display: inline-block; background-color: #28a745; color: #ffffff; text-decoration: none; padding: 12px 25px; margin: 25px 0; border-radius: 5px; font-weight: bold; font-size: 16px;">
                    ACESSAR MINHA CONTA
                </a>
                
                <p style="font-size: 14px; color: #777;">Se precisar de qualquer ajuda ou tiver dúvidas, nossa equipe de suporte está à disposição.</p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f4f4f4; color: #999; padding: 15px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">Atenciosamente,</p>
                <p style="margin: 0;">A Equipe Card YXS</p>
            </div>
        </div>
    `;

    await exports.sendEmail({
        email: user.email,
        name: user.username,
        subject: subject,
        message: message,
    });
};

