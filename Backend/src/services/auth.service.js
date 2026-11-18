import argon2 from 'argon2';
import { signToken } from '../security/auth.js';

export function authService(repo, env) {
  return {
    async register({ nome, email, password, papel = 'P04' }) {
      if (await repo.findUserByEmail(email)) throw Object.assign(new Error('Email já registado'), { status: 409 });
      const user = await repo.create('Utilizador', { nome, email, papel, ativo: true, passwordHash: await argon2.hash(password) });
      return { user: { id: user.idUtilizador ?? user.id, nome, email, papel }, token: signToken(user, env.JWT_SECRET) };
    },
    async login({ email, password }) {
      const user = await repo.findUserByEmail(email);
      if (!user || !user.passwordHash || !(await argon2.verify(user.passwordHash, password))) throw Object.assign(new Error('Credenciais inválidas'), { status: 401 });
      if (user.ativo === false) throw Object.assign(new Error('Conta desativada'), { status: 403 });
      return { user: { id: user.idUtilizador ?? user.id, nome: user.nome, email, papel: user.papel }, token: signToken(user, env.JWT_SECRET) };
    }
  };
}
