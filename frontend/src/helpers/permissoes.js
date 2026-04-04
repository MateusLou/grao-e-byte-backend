export function getAbasPermitidas() {
  try {
    return JSON.parse(localStorage.getItem('abasPermitidas') || '[]');
  } catch {
    return [];
  }
}

export function temPermissao(chave) {
  const role = localStorage.getItem('userRole');
  if (role === 'gerente') return true;
  return getAbasPermitidas().includes(chave);
}
