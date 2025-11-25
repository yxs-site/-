# Instruções de Implantação do Card YXS no Render

Este documento descreve como implantar a aplicação full-stack do Card YXS no Render, substituindo o site estático anterior.

## 1. Preparação do Repositório no GitHub

Antes de iniciar a implantação, você deve enviar todas as novas alterações para o seu repositório no GitHub. O código que eu gerei está pronto para ser enviado.

**A estrutura final do seu projeto deve ser a seguinte:**

```
card-yxs/
├── .env.example
├── controllers/
│   └── authController.js
├── middleware/
│   └── authMiddleware.js
├── models/
│   └── User.js
├── node_modules/ (não será enviado para o GitHub)
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── routes/
│   └── authRoutes.js
├── utils/
│   └── emailService.js
├── INSTRUCOES_DEPLOY_RENDER.md
├── package.json
├── package-lock.json
└── server.js
```

## 2. Criação do Serviço no Render

1.  **Acesse o Render:** Faça login no seu painel do Render.
2.  **Crie um Novo Serviço:** Clique em **"New +"** e selecione **"Web Service"**.
3.  **Conecte o Repositório:** Conecte o seu repositório do GitHub (`yxs-site/-`) e selecione-o.
4.  **Configurações do Serviço:**
    *   **Name:** Dê um nome ao seu serviço (ex: `card-yxs-backend`).
    *   **Region:** Escolha uma região próxima aos seus usuários (ex: `N. Virginia`).
    *   **Branch:** Selecione a branch principal (`main`).
    *   **Root Directory:** Deixe em branco (o Render detectará o `package.json` na raiz).
    *   **Runtime:** O Render deve detectar automaticamente **Node**.
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
    *   **Plan:** Escolha o plano gratuito (`Free`).

## 3. Configuração das Variáveis de Ambiente

Esta é a parte mais importante. O Render precisa das mesmas variáveis de ambiente que usamos no arquivo `.env`.

1.  **Vá para a aba "Environment"** do seu novo serviço no Render.
2.  **Adicione as seguintes variáveis de ambiente:**

| Chave (Key) | Valor (Value) |
| :--- | :--- |
| `MONGO_URI` | A sua string de conexão do MongoDB Atlas (com a senha correta). |
| `JWT_SECRET` | Uma chave secreta longa e aleatória (ex: `e9d2f4a7c1b8d6e3a5f0c9b1d4e6f8a3b5c7d0e2f1a4b6c8d9e0f3a1b2c4d6e8`). |
| `EMAIL_HOST` | O host do seu serviço de e-mail (ex: `smtp.gmail.com`). |
| `EMAIL_PORT` | A porta do seu serviço de e-mail (ex: `587`). |
| `EMAIL_USER` | O seu e-mail de envio. |
| `EMAIL_PASS` | A sua senha de e-mail ou senha de aplicativo (App Password). |
| `EMAIL_FROM` | O seu e-mail de envio formatado (ex: `"Card YXS <seu_email@gmail.com>"`). |

**Atenção:** Sem estas variáveis, a aplicação não funcionará corretamente.

## 4. Implantação (Deploy)

1.  **Clique em "Create Web Service"** para iniciar a implantação.
2.  O Render irá clonar o seu repositório, instalar as dependências e iniciar o servidor.
3.  Você pode acompanhar o progresso na aba **"Logs"**.

## 5. Acesso à Aplicação

Após a implantação bem-sucedida, o Render fornecerá uma URL pública para a sua aplicação (ex: `https://card-yxs-backend.onrender.com`).

**Acesse esta URL e teste todas as funcionalidades:**

*   Registro de um novo usuário.
*   Login e logout.
*   Recuperação de senha.
*   Verifique se os e-mails de boas-vindas e de recuperação de senha estão sendo enviados e recebidos.

Se tudo funcionar, o seu projeto Card YXS estará totalmente funcional com um backend e banco de dados robustos!
