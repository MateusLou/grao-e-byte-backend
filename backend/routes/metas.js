const express = require('express');
const Meta = require('../models/Meta');
const auth = require('../middleware/auth');
const requireGerente = require('../middleware/requireGerente');
const { registrarLog } = require('../helpers/logHelper');

const router = express.Router();

// GET /api/metas - Listar todas as metas
router.get('/', auth, async (req, res) => {
  try {
    const metas = await Meta.find().sort({ criadoEm: -1 });
    res.json(metas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar metas' });
  }
});

// POST /api/metas - Criar meta
router.post('/', auth, requireGerente, async (req, res) => {
  try {
    const { tipo, metrica, valor, inicioVigencia, fimVigencia } = req.body;
    if (!['diaria', 'semanal'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo deve ser "diaria" ou "semanal"' });
    }
    if (!['faturamento', 'pedidos'].includes(metrica)) {
      return res.status(400).json({ erro: 'Metrica deve ser "faturamento" ou "pedidos"' });
    }
    if (typeof valor !== 'number' || valor <= 0 || !isFinite(valor)) {
      return res.status(400).json({ erro: 'Valor deve ser um numero positivo' });
    }
    const inicio = new Date(inicioVigencia);
    const fim = new Date(fimVigencia);
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      return res.status(400).json({ erro: 'Datas invalidas' });
    }
    if (inicio >= fim) {
      return res.status(400).json({ erro: 'Data de inicio deve ser anterior a data de fim' });
    }
    const meta = await Meta.create({
      tipo,
      metrica,
      valor,
      inicioVigencia,
      fimVigencia,
      criadoPor: req.userId
    });
    registrarLog({ acao: 'meta', entidade: 'meta', entidadeId: meta._id, entidadeNome: `${metrica === 'faturamento' ? 'Faturamento' : 'Pedidos'} (${tipo === 'diaria' ? 'Diária' : 'Semanal'})`, userId: req.userId, detalhes: `Meta criada: ${metrica === 'faturamento' ? 'R$' + valor : valor + ' pedidos'}` });
    res.status(201).json(meta);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar meta' });
  }
});

// PUT /api/metas/:id - Atualizar meta
router.put('/:id', auth, requireGerente, async (req, res) => {
  try {
    const { tipo, metrica, valor, inicioVigencia, fimVigencia } = req.body;
    const meta = await Meta.findByIdAndUpdate(
      req.params.id,
      { tipo, metrica, valor, inicioVigencia, fimVigencia },
      { new: true }
    );
    if (!meta) {
      return res.status(404).json({ erro: 'Meta nao encontrada' });
    }
    registrarLog({ acao: 'meta', entidade: 'meta', entidadeId: meta._id, entidadeNome: `${metrica === 'faturamento' ? 'Faturamento' : 'Pedidos'} (${tipo === 'diaria' ? 'Diária' : 'Semanal'})`, userId: req.userId, detalhes: `Meta atualizada: ${metrica === 'faturamento' ? 'R$' + valor : valor + ' pedidos'}` });
    res.json(meta);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar meta' });
  }
});

// DELETE /api/metas/:id - Remover meta
router.delete('/:id', auth, requireGerente, async (req, res) => {
  try {
    const meta = await Meta.findByIdAndDelete(req.params.id);
    if (!meta) {
      return res.status(404).json({ erro: 'Meta nao encontrada' });
    }
    registrarLog({ acao: 'meta', entidade: 'meta', entidadeId: meta._id, entidadeNome: `${meta.metrica === 'faturamento' ? 'Faturamento' : 'Pedidos'} (${meta.tipo === 'diaria' ? 'Diária' : 'Semanal'})`, userId: req.userId, detalhes: 'Meta removida' });
    res.json({ mensagem: 'Meta removida' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover meta' });
  }
});

module.exports = router;
