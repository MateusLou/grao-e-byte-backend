import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validarEmail } from '../helpers/validacao';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [errosCampo, setErrosCampo] = useState({});
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    const erros = {};
    const erroEmail = validarEmail(email);
    if (erroEmail) erros.email = erroEmail;
    if (!senha) erros.senha = 'Senha é obrigatória';

    if (Object.keys(erros).length > 0) {
      setErrosCampo(erros);
      return;
    }

    setErrosCampo({});
    setEnviando(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Email ou senha incorretos');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('nomeUsuario', data.nome);
      localStorage.setItem('userRole', data.role);
      navigate('/dashboard');
    } catch {
      setErro('Erro de conexao com o servidor');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-logo">Grão & Byte</h1>
        <p className="login-subtitulo">Sistema de Gestão de Estoque</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrosCampo((prev) => ({ ...prev, email: '' })); }}
              placeholder="seu@email.com"
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
              placeholder="Sua senha"
              className={errosCampo.senha ? 'input-erro' : ''}
            />
            {errosCampo.senha && <span className="campo-erro">{errosCampo.senha}</span>}
          </div>

          {erro && <p className="erro-mensagem">{erro}</p>}

          <button type="submit" className="btn-primario" disabled={enviando}>
            {enviando && <span className="btn-spinner" />}
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
