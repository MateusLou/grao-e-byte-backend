const express = require('express');
const Venda = require('../models/Venda');
const Meta = require('../models/Meta');
const Product = require('../models/Product');
const Movimentacao = require('../models/Movimentacao');
const auth = require('../middleware/auth');
const requirePermissao = require('../middleware/requirePermissao');

const router = express.Router();

// GET /api/dashboard - Dados agregados do dashboard (gerente ou com permissao)
router.get('/', auth, requirePermissao('dashboard'), async (req, res) => {
  try {
    const TZ = 'America/Sao_Paulo';
    const agora = new Date();

    // Calcular inicio/fim do dia no timezone local usando Intl
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const hojeStr = formatter.format(agora); // YYYY-MM-DD no tz local
    const inicioHoje = new Date(`${hojeStr}T00:00:00.000-03:00`);

    // Ajustar offset dinamicamente para horario de verao
    const offsetMs = inicioHoje.getTime() - new Date(`${hojeStr}T00:00:00.000Z`).getTime();
    const inicioHojeUTC = new Date(new Date(`${hojeStr}T00:00:00.000Z`).getTime() - offsetMs);
    const fimHojeUTC = new Date(inicioHojeUTC.getTime() + 24 * 60 * 60 * 1000);

    const inicioOntem = new Date(inicioHojeUTC.getTime() - 24 * 60 * 60 * 1000);
    const fimOntem = new Date(inicioHojeUTC);

    const inicioSemPassada = new Date(inicioHojeUTC.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fimSemPassada = new Date(inicioSemPassada.getTime() + 24 * 60 * 60 * 1000);

    const statusNaoCancelado = { status: { $ne: 'cancelado' } };

    const [
      resumoHoje,
      resumoOntem,
      resumoSemPassada,
      statusPedidos,
      estoqueCritico,
      topVendidosHoje,
      metasAtivas,
      ultimasVendas,
      movimentoPorHora
    ] = await Promise.all([
      // 1. Resumo financeiro - hoje
      Venda.aggregate([
        { $match: { criadoEm: { $gte: inicioHojeUTC }, ...statusNaoCancelado } },
        { $group: { _id: null, faturamento: { $sum: '$total' }, pedidos: { $sum: 1 } } }
      ]),

      // 2. Resumo financeiro - ontem
      Venda.aggregate([
        { $match: { criadoEm: { $gte: inicioOntem, $lt: fimOntem }, ...statusNaoCancelado } },
        { $group: { _id: null, faturamento: { $sum: '$total' }, pedidos: { $sum: 1 } } }
      ]),

      // 3. Resumo financeiro - mesmo dia semana passada
      Venda.aggregate([
        { $match: { criadoEm: { $gte: inicioSemPassada, $lt: fimSemPassada }, ...statusNaoCancelado } },
        { $group: { _id: null, faturamento: { $sum: '$total' }, pedidos: { $sum: 1 } } }
      ]),

      // 4. Status dos pedidos (em_andamento e pronto)
      Venda.aggregate([
        { $match: { status: { $in: ['em_andamento', 'pronto'] } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // 5. Estoque critico (top 10)
      (async () => {
        const produtos = await Product.find({ ativo: true }).lean();
        const estoques = await Movimentacao.aggregate([
          { $group: { _id: '$produtoId', entradas: { $sum: { $cond: [{ $eq: ['$tipo', 'entrada'] }, '$quantidade', 0] } }, saidas: { $sum: { $cond: [{ $eq: ['$tipo', 'saida'] }, '$quantidade', 0] } } } }
        ]);
        const vendasStats = await Movimentacao.aggregate([
          { $match: { tipo: 'saida' } },
          { $group: { _id: '$produtoId', totalSaidas: { $sum: '$quantidade' }, primeiraSaida: { $min: '$data' } } }
        ]);

        const estoqueMap = {};
        estoques.forEach(e => { estoqueMap[e._id.toString()] = e.entradas - e.saidas; });

        const vendasMap = {};
        vendasStats.forEach(v => {
          const dias = Math.max(1, Math.ceil((Date.now() - new Date(v.primeiraSaida).getTime()) / (1000 * 60 * 60 * 24)));
          vendasMap[v._id.toString()] = Math.round((v.totalSaidas / dias) * 10) / 10;
        });

        return produtos
          .map(p => ({
            _id: p._id,
            nome: p.nome,
            categoria: p.categoria,
            estoque: estoqueMap[p._id.toString()] || 0,
            vendaMediaDiaria: vendasMap[p._id.toString()] || 0
          }))
          .filter(p => p.vendaMediaDiaria > 0 && p.estoque <= p.vendaMediaDiaria)
          .sort((a, b) => a.estoque - b.estoque)
          .slice(0, 10);
      })(),

      // 6. Top vendidos hoje
      Venda.aggregate([
        { $match: { criadoEm: { $gte: inicioHojeUTC }, ...statusNaoCancelado } },
        { $unwind: '$itens' },
        { $group: { _id: '$itens.produtoId', nome: { $first: '$itens.nome' }, quantidade: { $sum: '$itens.quantidade' }, faturamento: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnit'] } } } },
        { $sort: { quantidade: -1 } },
        { $limit: 5 }
      ]),

      // 7. Metas ativas
      (async () => {
        const metas = await Meta.find({
          inicioVigencia: { $lte: agora },
          fimVigencia: { $gte: agora }
        }).lean();

        const metasComProgresso = await Promise.all(metas.map(async (meta) => {
          if (meta.metrica === 'faturamento') {
            const result = await Venda.aggregate([
              { $match: { criadoEm: { $gte: meta.inicioVigencia, $lte: meta.fimVigencia }, ...statusNaoCancelado } },
              { $group: { _id: null, total: { $sum: '$total' } } }
            ]);
            return { ...meta, progresso: result[0]?.total || 0 };
          } else {
            const result = await Venda.aggregate([
              { $match: { criadoEm: { $gte: meta.inicioVigencia, $lte: meta.fimVigencia }, ...statusNaoCancelado } },
              { $group: { _id: null, total: { $sum: 1 } } }
            ]);
            return { ...meta, progresso: result[0]?.total || 0 };
          }
        }));

        return metasComProgresso;
      })(),

      // 8. Ultimas vendas
      Venda.find({ ...statusNaoCancelado })
        .populate('userId', 'nome')
        .sort({ criadoEm: -1 })
        .limit(15)
        .lean(),

      // 9. Movimento por hora (hoje) - com timezone correto
      Venda.aggregate([
        { $match: { criadoEm: { $gte: inicioHojeUTC }, ...statusNaoCancelado } },
        { $group: { _id: { $hour: { date: '$criadoEm', timezone: TZ } }, pedidos: { $sum: 1 }, faturamento: { $sum: '$total' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const hojeData = resumoHoje[0] || { faturamento: 0, pedidos: 0 };
    const ontemData = resumoOntem[0] || { faturamento: 0, pedidos: 0 };
    const semPassadaData = resumoSemPassada[0] || { faturamento: 0, pedidos: 0 };

    const statusMap = {};
    statusPedidos.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      resumoFinanceiro: {
        faturamentoHoje: hojeData.faturamento,
        pedidosHoje: hojeData.pedidos,
        ticketMedio: hojeData.pedidos > 0 ? Math.round((hojeData.faturamento / hojeData.pedidos) * 100) / 100 : 0,
        faturamentoOntem: ontemData.faturamento,
        pedidosOntem: ontemData.pedidos,
        faturamentoSemPassada: semPassadaData.faturamento,
        pedidosSemPassada: semPassadaData.pedidos
      },
      statusPedidos: {
        emAndamento: statusMap['em_andamento'] || 0,
        prontos: statusMap['pronto'] || 0
      },
      estoqueCritico,
      topVendidosHoje,
      metas: metasAtivas,
      ultimasVendas,
      movimentoPorHora
    });
  } catch (erro) {
    console.error('Erro no dashboard:', erro);
    res.status(500).json({ erro: 'Erro ao carregar dashboard' });
  }
});

module.exports = router;
