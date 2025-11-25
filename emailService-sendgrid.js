const nodemailer = require('nodemailer');

// Configurar transportador com SendGrid
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'apikey',
    pass: process.env.EMAIL_PASS || '',
  },
  connectionTimeout: 10000, // 10 segundos
  socketTimeout: 10000,     // 10 segundos
  pool: {
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5
  }
});

// Função para enviar e-mail com timeout
const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  return new Promise((resolve, reject) => {
    // Timeout de 8 segundos
    const timeout = setTimeout(() => {
      reject(new Error('Timeout ao enviar e-mail (8s)'));
    }, 8000);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Card YXS <noreply@yxs-site.onrender.com>',
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      clearTimeout(timeout);
      
      if (error) {
        console.error('✗ Erro ao enviar e-mail:', error.message);
        reject(new Error(`Falha no envio do e-mail: ${error.message}`));
      } else {
        console.log('✓ E-mail enviado com sucesso:', info.response);
        resolve(info);
      }
    });
  });
};

// Função para enviar e-mail de recuperação de senha
const sendPasswordResetEmail = async (email, resetLink) => {
  const subject = 'Recuperação de Senha - Card YXS';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Recuperação de Senha</h2>
      <p>Olá,</p>
      <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para criar uma nova senha:</p>
      <p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Redefinir Senha
        </a>
      </p>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p style="word-break: break-all; color: #666;">${resetLink}</p>
      <p style="color: #999; font-size: 12px;">Este link expira em 1 hora.</p>
      <p style="color: #999; font-size: 12px;">Se você não solicitou esta recuperação, ignore este e-mail.</p>
    </div>
  `;

  try {
    await sendEmail(email, subject, htmlContent);
    console.log('✓ E-mail de recuperação de senha enviado para:', email);
  } catch (error) {
    console.error('✗ Erro ao enviar e-mail de recuperação:', error.message);
    throw error;
  }
};

// Função para enviar e-mail de boas-vindas
const sendWelcomeEmail = async (email, name) => {
  const subject = 'Bem-vindo(a) ao Card YXS!';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Bem-vindo(a) ao Card YXS!</h2>
      <p>Olá <strong>${name}</strong>,</p>
      <p>Sua conta foi criada com sucesso! 🎉</p>
      <p>Agora você pode fazer login e começar a usar o Card YXS.</p>
      <p>
        <a href="https://yxs-site.onrender.com" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
          Acessar Card YXS
        </a>
      </p>
      <p style="color: #999; font-size: 12px;">Se você não criou esta conta, ignore este e-mail.</p>
    </div>
  `;

  try {
    await sendEmail(email, subject, htmlContent);
    console.log('✓ E-mail de boas-vindas enviado para:', email);
  } catch (error) {
    console.error('✗ Erro ao enviar e-mail de boas-vindas:', error.message);
    // Não lança erro para não bloquear o registro
  }
};

// Função para enviar e-mail de confirmação de reset
const sendResetConfirmationEmail = async (email) => {
  const subject = 'Senha Redefinida - Card YXS';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Senha Redefinida com Sucesso</h2>
      <p>Olá,</p>
      <p>Sua senha foi redefinida com sucesso! ✓</p>
      <p>Você agora pode fazer login com sua nova senha.</p>
      <p>
        <a href="https://yxs-site.onrender.com" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Fazer Login
        </a>
      </p>
      <p style="color: #999; font-size: 12px;">Se você não fez esta alteração, entre em contato conosco imediatamente.</p>
    </div>
  `;

  try {
    await sendEmail(email, subject, htmlContent);
    console.log('✓ E-mail de confirmação de reset enviado para:', email);
  } catch (error) {
    console.error('✗ Erro ao enviar e-mail de confirmação:', error.message);
    // Não lança erro
  }
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendResetConfirmationEmail,
};
