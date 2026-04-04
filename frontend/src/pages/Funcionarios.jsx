import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { validarNome, validarEmail, validarSenha } from '../helpers/validacao';

const ABAS_DISPONIVEIS = [
  { chave: 'dashboard', label: 'Dashboard' },
  { chave: 'novo_produto', label: 'Novo Produto' },
  { chave: 'movimentacoes', label: 'Movimentacoes' },
  { chave: 'alertas', label: 'Alertas' }
];

function Funcionarios() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cadastrando, setCadastrando] = useState(false);
  const [errosCampo, setErrosCampo] = useState({});
  const [permissaoAberta, setPermissaoAberta] = useState(null);
  const [permissaoEditando, setPermissaoEditando] = useState([]);
  const [salvandoPermissao, setSalvandoPermissao] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const { showToast } = useToast();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (userRole !== 'gerente') {
      navigate('/products');
      return;
    }
    carregarFuncionarios();
  }, []);

  const carregarFuncionarios = async () => {
    try {
      const response = await fetch('/api/auth/funcionarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFuncionarios(data);
      }
    } catch {
      showToast('Erro ao carregar funcionarios', 'error');
    }
  };

  const handleDeletar = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);

    try {
      const response = await fetch(`/api/auth/funcionarios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('Funcionario removido com sucesso!', 'success');
        carregarFuncionarios();
      } else {
        const data = await response.json();
        showToast(data.erro || 'Erro ao remover funcionario', 'error');
      }
    } catch {
      showToast('Erro de conexao com o servidor', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const erros = {};
    const erroNome = validarNome(nome);
    const erroEmail = validarEmail(email);
    const erroSenha = validarSenha(senha);
    if (erroNome) erros.nome = erroNome;
    if (erroEmail) erros.email = erroEmail;
    if (erroSenha) erros.senha = erroSenha;
    if (senha !== confirmarSenha) erros.confirmarSenha = 'As senhas nao coincidem';

    if (Object.keys(erros).length > 0) {
      setErrosCampo(erros);
      return;
    }

    setErrosCampo({});
    setCadastrando(true);
    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nome, email, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.erro || 'Erro ao cadastrar funcionario', 'error');
        return;
      }

      showToast(`Funcionario "${nome}" cadastrado com sucesso!`, 'success');
      setNome('');
      setEmail('');
      setSenha('');
      setConfirmarSenha('');
      carregarFuncionarios();
    } catch {
      showToast('Erro de conexao com o servidor', 'error');
    } finally {
      setCadastrando(false);
    }
  };

  const abrirPermissoes = (func) => {
    if (permissaoAberta === func._id) {
      setPermissaoAberta(null);
      return;
    }
    setPermissaoAberta(func._id);
    setPermissaoEditando([...(func.abasPermitidas || [])]);
  };

  const togglePermissao = (chave) => {
    setPermissaoEditando(prev =>
      prev.includes(chave) ? prev.filter(a => a !== chave) : [...prev, chave]
    );
  };

  const salvarPermissoes = async (funcId) => {
    setSalvandoPermissao(true);
    try {
      const response = await fetch(`/api/auth/funcionarios/${funcId}/permissoes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ abasPermitidas: permissaoEditando })
      });

      if (response.ok) {
        showToast('Permissoes atualizadas!', 'success');
        setPermissaoAberta(null);
        carregarFuncionarios();
      } else {
        const data = await response.json();
        showToast(data.erro || 'Erro ao atualizar permissoes', 'error');
      }
    } catch {
      showToast('Erro de conexao com o servidor', 'error');
    } finally {
      setSalvandoPermissao(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-titulo">Funcionarios</h2>
          <p className="page-subtitulo">Cadastre novos membros da equipe e gerencie permissoes</p>
        </div>
      </div>

      <div className="func-layout">
        <div className="form-container">
          <h3 className="form-section-titulo">Novo Funcionario</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => { setNome(e.target.value); setErrosCampo((prev) => ({ ...prev, nome: '' })); }}
                placeholder="Ex: Ana Costa"
                className={errosCampo.nome ? 'input-erro' : ''}
              />
              {errosCampo.nome && <span className="campo-erro">{errosCampo.nome}</span>}
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrosCampo((prev) => ({ ...prev, email: '' })); }}
                placeholder="ana@graobyte.com"
                className={errosCampo.email ? 'input-erro' : ''}
              />
              {errosCampo.email && <span className="campo-erro">{errosCampo.email}</span>}
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErrosCampo((prev) => ({ ...prev, senha: '' })); }}
                placeholder="Minimo 6 caracteres"
                className={errosCampo.senha ? 'input-erro' : ''}
              />
              {errosCampo.senha && <span className="campo-erro">{errosCampo.senha}</span>}
            </div>

            <div className="form-group">
              <label>Confirmar Senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => { setConfirmarSenha(e.target.value); setErrosCampo((prev) => ({ ...prev, confirmarSenha: '' })); }}
                placeholder="Repita a senha"
                className={errosCampo.confirmarSenha ? 'input-erro' : ''}
              />
              {errosCampo.confirmarSenha && <span className="campo-erro">{errosCampo.confirmarSenha}</span>}
            </div>

            <button type="submit" className="btn-primario" disabled={cadastrando}>
              {cadastrando && <span className="btn-spinner" />}
              {cadastrando ? 'Cadastrando...' : 'Cadastrar Funcionario'}
            </button>
          </form>
        </div>

        <div className="func-lista-container">
          <h3 className="form-section-titulo">Equipe Atual</h3>
          {funcionarios.length === 0 ? (
            <p style={{ color: '#999', fontSize: '0.85rem' }}>Nenhum funcionario cadastrado.</p>
          ) : (
            <div className="func-lista">
              {funcionarios.map((func) => (
                <div key={func._id} className="func-item-wrapper">
                  <div className="func-item">
                    <div className="tabela-avatar">
                      {func.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="func-item-info">
                      <span className="tabela-nome">{func.nome}</span>
                      <span className="tabela-email">{func.email}</span>
                      {func.role !== 'gerente' && func.abasPermitidas && func.abasPermitidas.length > 0 && (
                        <div className="func-permissoes-badges">
                          {func.abasPermitidas.map(aba => {
                            const info = ABAS_DISPONIVEIS.find(a => a.chave === aba);
                            return info ? (
                              <span key={aba} className="permissao-badge">{info.label}</span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <div className="func-item-acoes">
                      {func.role !== 'gerente' && (
                        <button
                          className={`func-btn-permissao ${permissaoAberta === func._id ? 'func-btn-permissao-ativo' : ''}`}
                          onClick={() => abrirPermissoes(func)}
                          title="Gerenciar permissoes"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                          </svg>
                        </button>
                      )}
                      {func.role !== 'gerente' && (
                        <button
                          className="func-btn-deletar"
                          onClick={() => setDeleteTarget({ id: func._id, nome: func.nome })}
                          title="Remover funcionario"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {permissaoAberta === func._id && (
                    <div className="permissao-painel">
                      <span className="permissao-painel-titulo">Abas de Gerencia</span>
                      <div className="permissao-toggles">
                        {ABAS_DISPONIVEIS.map(aba => (
                          <button
                            key={aba.chave}
                            className={`permissao-toggle ${permissaoEditando.includes(aba.chave) ? 'permissao-toggle-ativo' : ''}`}
                            onClick={() => togglePermissao(aba.chave)}
                            type="button"
                          >
                            {aba.label}
                          </button>
                        ))}
                      </div>
                      <div className="permissao-acoes">
                        <button
                          className="btn-permissao-salvar"
                          onClick={() => salvarPermissoes(func._id)}
                          disabled={salvandoPermissao}
                        >
                          {salvandoPermissao ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          className="btn-permissao-cancelar"
                          onClick={() => setPermissaoAberta(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remover Funcionario"
        message={deleteTarget ? `Tem certeza que deseja remover "${deleteTarget.nome}"?` : ''}
        confirmLabel="Remover"
        onConfirm={handleDeletar}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </Layout>
  );
}

export default Funcionarios;
