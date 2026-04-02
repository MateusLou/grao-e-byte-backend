const express = require('express');
const Product = require('../models/Product');
const Movimentacao = require('../models/Movimentacao');

const router = express.Router();

// GET /api/cardapio - Cardapio publico (sem autenticacao)
router.get('/', async (req, res) => {
  try {
    const produtos = await Product.find(
      { ativo: { $ne: false } },
      'nome descricao preco categoria tags posicao'
    ).sort({ categoria: 1, posicao: 1, nome: 1 });

    // Calcular estoque de cada produto
    const estoques = await Movimentacao.aggregate([
      {
        $group: {
          _id: '$produtoId',
          entradas: { $sum: { $cond: [{ $eq: ['$tipo', 'entrada'] }, '$quantidade', 0] } },
          saidas: { $sum: { $cond: [{ $eq: ['$tipo', 'saida'] }, '$quantidade', 0] } }
        }
      }
    ]);

    const estoqueMap = {};
    estoques.forEach((e) => {
      estoqueMap[e._id.toString()] = e.entradas - e.saidas;
    });

    // Filtrar apenas produtos com estoque > 0
    const produtosComEstoque = produtos
      .filter((p) => (estoqueMap[p._id.toString()] || 0) > 0)
      .map((p) => ({
        _id: p._id,
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        categoria: p.categoria,
        tags: p.tags
      }));

    res.json(produtosComEstoque);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar cardapio' });
  }
});

module.exports = router;
