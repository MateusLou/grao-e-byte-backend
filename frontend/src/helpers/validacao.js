export function validarEmail(email) {
  if (!email || !email.trim()) return 'Email é obrigatório';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Email inválido';
  return '';
}

export function validarSenha(senha) {
  if (!senha) return 'Senha é obrigatória';
  if (senha.length < 6) return 'Senha deve ter no mínimo 6 caracteres';
  return '';
}

export function validarNome(nome) {
  if (!nome || !nome.trim()) return 'Nome é obrigatório';
  if (nome.trim().length < 2) return 'Nome deve ter no mínimo 2 caracteres';
  return '';
}

export function validarPreco(preco) {
  const valor = Number(preco);
  if (isNaN(valor) || valor <= 0) return 'Preço deve ser maior que zero';
  return '';
}
