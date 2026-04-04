const User = require('../models/User');

function requirePermissao(permissao) {
  return async (req, res, next) => {
    // Gerentes sempre tem acesso total
    if (req.userRole === 'gerente') return next();

    try {
      const user = await User.findById(req.userId).select('abasPermitidas');
      if (!user) {
        return res.status(401).json({ erro: 'Usuario nao encontrado' });
      }

      if (user.abasPermitidas && user.abasPermitidas.includes(permissao)) {
        return next();
      }

      return res.status(403).json({ erro: 'Sem permissao para acessar este recurso' });
    } catch (erro) {
      return res.status(500).json({ erro: 'Erro ao verificar permissoes' });
    }
  };
}

module.exports = requirePermissao;
