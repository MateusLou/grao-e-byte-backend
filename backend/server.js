const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const movimentacoesRoutes = require('./routes/movimentacoes');
const logsRoutes = require('./routes/logs');
const cardapioRoutes = require('./routes/cardapio');
const vendasRoutes = require('./routes/vendas');
const metasRoutes = require('./routes/metas');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/movimentacoes', movimentacoesRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/cardapio', cardapioRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota de teste da API
app.get('/api/status', (req, res) => {
  res.json({ mensagem: 'API Grao & Byte funcionando!' });
});

// Servir frontend em producao
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Conexao com MongoDB e inicio do servidor
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Conectado ao MongoDB!');

    // Migration one-time: garantir que o admin tenha role gerente (so roda se nenhum gerente existir)
    const User = require('./models/User');
    const gerenteExiste = await User.findOne({ role: 'gerente' });
    if (!gerenteExiste && process.env.ADMIN_EMAIL) {
      await User.updateMany(
        { email: process.env.ADMIN_EMAIL },
        { $set: { role: 'gerente' } }
      );
      console.log('Migration: admin promovido a gerente (primeira execucao)');
    }

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((erro) => {
    console.error('Erro ao conectar ao MongoDB:', erro.message);
  });
