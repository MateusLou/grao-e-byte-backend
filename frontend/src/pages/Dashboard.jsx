import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import ResumoFinanceiro from '../components/dashboard/ResumoFinanceiro';

import EstoqueCritico from '../components/dashboard/EstoqueCritico';
import MetasDoDia from '../components/dashboard/MetasDoDia';
import TopVendidos from '../components/dashboard/TopVendidos';
import GraficoPorHora from '../components/dashboard/GraficoPorHora';
import UltimasVendas from '../components/dashboard/UltimasVendas';
import StatusPedidos from '../components/dashboard/StatusPedidos';
import { temPermissao } from '../helpers/permissoes';

function Dashboard() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = localStorage.getItem('token');
  const isGerente = localStorage.getItem('userRole') === 'gerente';

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!temPermissao('dashboard')) {
      navigate('/products');
      return;
    }
  }, []);

  const fetchDashboard = useCallback(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setDados(data);
          setUltimaAtualizacao(new Date());
        }
      })
      .catch(() => { showToast('Erro ao carregar dashboard', 'error'); })
      .finally(() => setCarregando(false));
  }, [token, navigate, showToast]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (carregando) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!dados) {
    return (
      <Layout>
        <p style={{ padding: 24, color: '#999' }}>Erro ao carregar dados.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-titulo">Dashboard</h2>
          <p className="page-subtitulo">
            Visao geral do dia
            {ultimaAtualizacao && (
              <span style={{ marginLeft: 12, fontSize: '0.72rem', color: '#9CA3AF' }}>
                Atualizado as {ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-cancelar"
            onClick={fetchDashboard}
            style={{ width: 'auto', minHeight: 40 }}
            title="Atualizar dados"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Linha 1: Resumo financeiro */}
      <ResumoFinanceiro dados={dados.resumoFinanceiro} />

      {/* Status dos pedidos ativos */}
      <div style={{ marginTop: 20 }}>
        <StatusPedidos dados={dados.statusPedidos} />
      </div>

      {/* Linha 2: Estoque + Metas */}
      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        <EstoqueCritico dados={dados.estoqueCritico} />
        <MetasDoDia dados={dados.metas} isGerente={isGerente} token={token} onMetaChanged={fetchDashboard} />
      </div>

      {/* Linha 3: Top vendidos + Grafico por hora */}
      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        <TopVendidos dados={dados.topVendidosHoje} />
        <GraficoPorHora dados={dados.movimentoPorHora} />
      </div>

      {/* Linha 4: Ultimas vendas */}
      <div style={{ marginTop: 20 }}>
        <UltimasVendas dados={dados.ultimasVendas} />
      </div>

    </Layout>
  );
}

export default Dashboard;
