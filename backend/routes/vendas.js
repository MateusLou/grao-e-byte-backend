const express = require('express');
const mongoose = require('mongoose');
const Venda = require('../models/Venda');
const Product = require('../models/Product');
const Movimentacao = require('../models/Movimentacao');
const auth = require('../middleware/auth');
const requireGerente = require('../middleware/requireGerente');
const { registrarLog } = require('../helpers/logHelper');

const router = express.Router();

// POST /api/vendas - Criar nova venda (com transacao para evitar oversell)
router.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { itens } = req.body;
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ erro: 'Itens da venda sao obrigatorios' });
    }

    // Validar quantidades positivas
    for (const item of itens) {
      const qty = item.quantidade || 0;
      if (!Number.isInteger(qty) || qty <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ erro: 'Quantidade deve ser um numero inteiro positivo' });
      }
    }

    // Buscar todos os produtos de uma vez (batch)
    const produtoIds = itens.map(i => i.produtoId);
    const produtos = await Product.find({ _id: { $in: produtoIds } }).session(session).lean();
    const produtoMap = {};
    produtos.forEach(p => { produtoMap[p._id.toString()] = p; });

    // Validar que todos os produtos existem
    for (const item of itens) {
      if (!produtoMap[item.produtoId]) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ erro: `Produto ${item.produtoId} nao encontrado` });
      }
    }

    // Calcular estoque de todos os produtos de uma vez (batch)
    const estoques = await Movimentacao.aggregate([
      { $match: { produtoId: { $in: produtos.map(p => p._id) } } },
      { $group: {
        _id: '$produtoId',
        entradas: { $sum: { $cond: [{ $eq: ['$tipo', 'entrada'] }, '$quantidade', 0] } },
        saidas: { $sum: { $cond: [{ $eq: ['$tipo', 'saida'] }, '$quantidade', 0] } }
      }}
    ]).session(session);

    const estoqueMap = {};
    estoques.forEach(e => { estoqueMap[e._id.toString()] = e.entradas - e.saidas; });

    // Validar estoque para cada item
    const itensVenda = [];
    let total = 0;

    for (const item of itens) {
      const produto = produtoMap[item.produtoId];
      const qty = item.quantidade;
      const estoqueAtual = estoqueMap[item.produtoId] || 0;

      if (qty > estoqueAtual) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ erro: `Estoque insuficiente para "${produto.nome}". Disponivel: ${estoqueAtual}` });
      }

      const subtotal = Math.round(produto.preco * qty * 100) / 100;
      itensVenda.push({
        produtoId: produto._id,
        nome: produto.nome,
        quantidade: qty,
        precoUnit: produto.preco
      });
      total += subtotal;
    }

    // Criar venda dentro da transacao
    const [venda] = await Venda.create([{
      itens: itensVenda,
      total: Math.round(total * 100) / 100,
      status: 'em_andamento',
      userId: req.userId
    }], { session });

    // Criar movimentacoes de saida em batch
    const movimentacoes = itensVenda.map(item => ({
      produtoId: item.produtoId,
      tipo: 'saida',
      origem: 'venda',
      quantidade: item.quantidade,
      userId: req.userId
    }));
    await Movimentacao.insertMany(movimentacoes, { session });

    await session.commitTransaction();
    session.endSession();

    registrarLog({
      acao: 'venda',
      entidade: 'venda',
      entidadeId: venda._id,
      entidadeNome: `Venda #${venda._id.toString().slice(-6)}`,
      userId: req.userId,
      detalhes: `${itensVenda.length} itens - R$${total.toFixed(2)}`
    });

    res.status(201).json(venda);
  } catch (erro) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ erro: 'Erro ao criar venda' });
  }
});

// GET /api/vendas - Listar vendas recentes
router.get('/', auth, async (req, res) => {
  try {
    const vendas = await Venda.find()
      .populate('userId', 'nome email')
      .sort({ criadoEm: -1 })
      .limit(50);
    res.json(vendas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar vendas' });
  }
});

// GET /api/vendas/:id - Detalhe de uma venda
router.get('/:id', auth, async (req, res) => {
  try {
    const venda = await Venda.findById(req.params.id).populate('userId', 'nome email');
    if (!venda) {
      return res.status(404).json({ erro: 'Venda nao encontrada' });
    }
    res.json(venda);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar venda' });
  }
});

// PATCH /api/vendas/:id/status - Atualizar status (somente gerente pode cancelar)
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;

  if (!['em_andamento', 'pronto', 'finalizado', 'cancelado'].includes(status)) {
    return res.status(400).json({ erro: 'Status invalido' });
  }

  // Cancelamento requer transacao para garantir consistencia do estoque
  if (status === 'cancelado') {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const venda = await Venda.findById(req.params.id).session(session);
      if (!venda) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ erro: 'Venda nao encontrada' });
      }
      if (venda.status === 'finalizado' || venda.status === 'cancelado') {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ erro: 'Venda ja finalizada ou cancelada' });
      }

      // Criar movimentacoes compensatorias dentro da transacao
      for (const item of venda.itens) {
        await Movimentacao.create([{
          produtoId: item.produtoId,
          tipo: 'entrada',
          origem: 'cancelamento',
          quantidade: item.quantidade,
          userId: req.userId
        }], { session });
      }

      venda.status = 'cancelado';
      await venda.save({ session });

      await session.commitTransaction();
      session.endSession();

      registrarLog({
        acao: 'cancelar_venda',
        entidade: 'venda',
        entidadeId: venda._id,
        entidadeNome: `Venda #${venda._id.toString().slice(-6)}`,
        userId: req.userId,
        detalhes: `Estoque restaurado`
      });

      return res.json(venda);
    } catch (erro) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ erro: 'Erro ao cancelar venda' });
    }
  }

  // Demais mudancas de status (pronto, finalizado)
  try {
    const venda = await Venda.findById(req.params.id);
    if (!venda) {
      return res.status(404).json({ erro: 'Venda nao encontrada' });
    }

    if (venda.status === 'finalizado' || venda.status === 'cancelado') {
      return res.status(400).json({ erro: 'Venda ja finalizada ou cancelada' });
    }

    venda.status = status;
    if (status === 'finalizado') {
      venda.finalizadoEm = new Date();
    }
    await venda.save();

    if (status === 'pronto') {
      registrarLog({
        acao: 'venda',
        entidade: 'venda',
        entidadeId: venda._id,
        entidadeNome: `Venda #${venda._id.toString().slice(-6)}`,
        userId: req.userId,
        detalhes: 'Pedido marcado como pronto'
      });
    } else if (status === 'finalizado') {
      registrarLog({
        acao: 'venda',
        entidade: 'venda',
        entidadeId: venda._id,
        entidadeNome: `Venda #${venda._id.toString().slice(-6)}`,
        userId: req.userId,
        detalhes: `Venda finalizada - R$${venda.total.toFixed(2)}`
      });
    }

    res.json(venda);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar status da venda' });
  }
});

module.exports = router;
