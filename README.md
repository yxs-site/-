# Card YXS - Site com Registro e E-mail

Site completo do jogo Card YXS com sistema de registro de usuários, banco de dados e envio automático de e-mail de boas-vindas.

## 🎮 Funcionalidades

- ✅ Tela de carregamento animada
- ✅ Sistema de registro de usuários
- ✅ Banco de dados SQLite para salvar registros
- ✅ Envio automático de e-mail de boas-vindas
- ✅ Validação de formulários
- ✅ Design moderno e responsivo

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm (geralmente vem com o Node.js)
- Uma conta Gmail para enviar e-mails (opcional, mas recomendado)

## 🚀 Como Instalar e Rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar e-mail (IMPORTANTE!)

Para o envio de e-mails funcionar, você precisa configurar suas credenciais do Gmail:

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Crie uma senha de aplicativo do Gmail:
   - Acesse: https://myaccount.google.com/apppasswords
   - Faça login na sua conta Google
   - Selecione "Outro (nome personalizado)" e digite "Card YXS"
   - Clique em "Gerar"
   - Copie a senha gerada (16 caracteres)

3. Edite o arquivo `.env` e coloque suas credenciais:
   ```
   EMAIL_USER=seu-email@gmail.com
   EMAIL_PASS=sua-senha-de-aplicativo-de-16-caracteres
   ```

**IMPORTANTE:** Nunca compartilhe seu arquivo `.env` com ninguém! Ele contém informações sensíveis.

### 3. Iniciar o servidor

```bash
npm start
```

O servidor vai iniciar em: **http://localhost:3000**

## 📁 Estrutura do Projeto

```
card-yxs/
├── public/              # Arquivos do frontend
│   ├── index.html      # Página principal
│   ├── style.css       # Estilos
│   └── script.js       # JavaScript do frontend
├── server/             # Arquivos do backend
│   ├── index.js        # Servidor Express
│   └── users.db        # Banco de dados (criado automaticamente)
├── package.json        # Dependências do projeto
├── .env.example        # Exemplo de configuração
└── README.md          # Este arquivo
```

## 🗄️ Banco de Dados

O banco de dados SQLite é criado automaticamente em `server/users.db` quando você inicia o servidor pela primeira vez.

### Ver usuários registrados

Você pode acessar a API para ver todos os usuários:

```
GET http://localhost:3000/api/users
```

Ou abra no navegador: http://localhost:3000/api/users

## 📧 E-mail de Boas-vindas

Quando um usuário se registra, ele recebe automaticamente um e-mail de boas-vindas com:
- Mensagem personalizada com o nome do usuário
- Design bonito com as cores do Card YXS
- Confirmação do cadastro

## 🌐 Como Hospedar na Internet

### Opção 1: Heroku (Gratuito)

1. Crie uma conta em https://heroku.com
2. Instale o Heroku CLI
3. Execute:
   ```bash
   heroku create card-yxs
   heroku config:set EMAIL_USER=seu-email@gmail.com
   heroku config:set EMAIL_PASS=sua-senha-de-aplicativo
   git push heroku main
   ```

### Opção 2: Railway (Gratuito)

1. Crie uma conta em https://railway.app
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente (EMAIL_USER e EMAIL_PASS)
4. Deploy automático!

### Opção 3: Render (Gratuito)

1. Crie uma conta em https://render.com
2. Crie um novo Web Service
3. Conecte seu repositório
4. Configure as variáveis de ambiente
5. Deploy!

## 🔧 Personalização

### Alterar cores

Edite o arquivo `public/style.css` e procure por:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Substitua `#667eea` e `#764ba2` pelas cores que você quiser.

### Alterar tempo de carregamento

Edite o arquivo `public/script.js` e procure por:
```javascript
setTimeout(() => {
    switchScreen(loadingScreen, registerScreen);
}, 3000); // 3000 = 3 segundos
```

### Alterar conteúdo do e-mail

Edite o arquivo `server/index.js` e procure pela seção `mailOptions`.

## ⚠️ Problemas Comuns

### E-mails não estão sendo enviados

- Verifique se você criou uma senha de aplicativo (não use sua senha normal do Gmail)
- Verifique se o arquivo `.env` está configurado corretamente
- Verifique se a autenticação de dois fatores está ativada no Gmail

### Erro ao instalar dependências

Se você tiver problemas com `better-sqlite3`, instale as ferramentas de build:

**Windows:**
```bash
npm install --global windows-build-tools
```

**Linux/Mac:**
```bash
sudo apt-get install build-essential
```

### Porta 3000 já está em uso

Edite o arquivo `.env` e mude a porta:
```
PORT=8080
```

## 📝 Licença

Este projeto é de código aberto. Você pode usar, modificar e distribuir livremente.

## 🤝 Suporte

Se tiver dúvidas ou problemas, abra uma issue no repositório!

---

**Feito com ❤️ para Card YXS**
