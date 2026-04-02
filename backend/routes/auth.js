const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireGerente = require('../middleware/requireGerente');
const { registrarLog } = require('../helpers/logHelper');

const router = express.Router();

// POST /api/auth/registro (apenas gerentes podem registrar novos funcionarios)
router.post('/registro', auth, requireGerente, async (req, res) => {
  try {
    const nome = (req.body.nome || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const senha = req.body.senha || '';

    if (!nome || nome.length < 2) {
      return res.status(400).json({ erro: 'Nome deve ter pelo menos 2 caracteres' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ erro: 'Email invalido' });
    }
    if (!senha || senha.length < 6) {
      return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar se usuario ja existe
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ erro: 'Email ja cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuario (sempre funcionario)
    const usuario = await User.create({ nome, email, senha: senhaHash, role: 'funcionario' });

    // Gerar token
    const token = jwt.sign({ userId: usuario._id, role: usuario.role }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    registrarLog({ acao: 'registro', entidade: 'funcionario', entidadeId: usuario._id, entidadeNome: usuario.nome, userId: usuario._id, detalhes: `Email: ${email}` });
    res.status(201).json({ token, nome: usuario.nome, role: usuario.role });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar conta' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const senha = req.body.senha || '';

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha sao obrigatorios' });
    }

    // Buscar usuario
    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ erro: 'Email ou senha incorretos' });
    }

    // Comparar senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(400).json({ erro: 'Email ou senha incorretos' });
    }

    // Gerar token
    const token = jwt.sign({ userId: usuario._id, role: usuario.role }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({ token, nome: usuario.nome, role: usuario.role });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// GET /api/auth/funcionarios - Listar todos os usuarios (apenas gerentes)
router.get('/funcionarios', auth, requireGerente, async (req, res) => {
  try {
    const funcionarios = await User.find({}, 'nome email role');
    res.json(funcionarios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar funcionarios' });
  }
});

// DELETE /api/auth/funcionarios/:id - Remover funcionario
router.delete('/funcionarios/:id', auth, requireGerente, async (req, res) => {
  try {
    // Nao permite deletar a si mesmo
    if (req.params.id === req.userId.toString()) {
      return res.status(400).json({ erro: 'Voce nao pode remover a si mesmo' });
    }

    const usuario = await User.findByIdAndDelete(req.params.id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Funcionario nao encontrado' });
    }
    registrarLog({ acao: 'remover_funcionario', entidade: 'funcionario', entidadeId: usuario._id, entidadeNome: usuario.nome, userId: req.userId });
    res.json({ mensagem: 'Funcionario removido com sucesso' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover funcionario' });
  }
});

module.exports = router;
