function calcDelta(atual, anterior) {
  if (!anterior || anterior === 0) return null;
  return ((atual - anterior) / anterior * 100).toFixed(1);
}

function DeltaBadge({ valor }) {
  if (valor === null) return <span className="delta-badge delta-neutro">N/A</span>;
  const num = parseFloat(valor);
  const cls = num >= 0 ? 'delta-positivo' : 'delta-negativo';
  const sinal = num >= 0 ? '+' : '';
  return <span className={`delta-badge ${cls}`}>{sinal}{valor}%</span>;
}

function ResumoFinanceiro({ dados }) {
  if (!dados) return null;

  const d = {
    faturamentoHoje: dados.faturamentoHoje || 0,
    faturamentoOntem: dados.faturamentoOntem || 0,
    faturamentoSemPassada: dados.faturamentoSemPassada || 0,
    pedidosHoje: dados.pedidosHoje || 0,
    pedidosOntem: dados.pedidosOntem || 0,
    ticketMedio: dados.ticketMedio || 0,
    pedidosSemPassada: dados.pedidosSemPassada || 0
  };

  const deltaFatOntem = calcDelta(d.faturamentoHoje, d.faturamentoOntem);
  const deltaPedOntem = calcDelta(d.pedidosHoje, d.pedidosOntem);
  const deltaFatSemana = calcDelta(d.faturamentoHoje, d.faturamentoSemPassada);

  return (
    <div className="resumo-bar resumo-bar-4">
      <div className="resumo-card">
        <span className="resumo-label">Faturamento Hoje</span>
        <span className="resumo-numero" style={{ color: '#059669' }}>
          R$ {d.faturamentoHoje.toFixed(2)}
        </span>
        <span className="resumo-detalhe">
          vs ontem <DeltaBadge valor={deltaFatOntem} />
        </span>
      </div>
      <div className="resumo-card">
        <span className="resumo-label">Ticket Médio</span>
        <span className="resumo-numero" style={{ color: '#D97706' }}>
          R$ {d.ticketMedio.toFixed(2)}
        </span>
        <span className="resumo-detalhe">
          {d.pedidosHoje} pedidos hoje
        </span>
      </div>
      <div className="resumo-card">
        <span className="resumo-label">Pedidos Hoje</span>
        <span className="resumo-numero" style={{ color: '#2563EB' }}>
          {d.pedidosHoje}
        </span>
        <span className="resumo-detalhe">
          vs ontem <DeltaBadge valor={deltaPedOntem} />
        </span>
      </div>
      <div className="resumo-card">
        <span className="resumo-label">Mesmo dia sem. passada</span>
        <span className="resumo-numero" style={{ color: '#7C3AED' }}>
          R$ {d.faturamentoSemPassada.toFixed(2)}
        </span>
        <span className="resumo-detalhe">
          faturamento <DeltaBadge valor={deltaFatSemana} />
        </span>
      </div>
    </div>
  );
}

export default ResumoFinanceiro;
