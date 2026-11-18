import jwt from 'jsonwebtoken';

export function signToken(user, secret) {
  const id = user.idUtilizador ?? user.id;
  return jwt.sign({ sub: id, papel: user.papel, email: user.email }, secret, { expiresIn: '60m' });
}

export function authenticate(secret) {
  return (req, res, next) => {
    const header = req.get('authorization');
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token de autenticação necessário' });
    try {
      req.user = jwt.verify(header.slice(7), secret);
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  };
}

export function requireRoles(...roles) {
  return (req, res, next) => roles.includes(req.user?.papel) ? next() : res.status(403).json({ error: 'Permissão insuficiente' });
}
