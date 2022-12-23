import { Prisma, Session, User } from '@prisma/client';

import prisma from '../../utils/prisma';
import { signJwt, verifyJwt } from '../../utils/jwt';

/*****************************************************************************
 * Session Services
 *****************************************************************************/
export async function createSession(userId: User['id']) {
  return prisma.session.create({ data: { user: { connect: { id: userId } } } });
}

export async function getSession(where: Prisma.SessionWhereInput) {
  return prisma.session.findFirst({ where });
}

// For further usage
// export async function getAllSessionsByUserId(userId: User['id']) {
//   return prisma.session.findMany({ where: { user: { id: userId }, valid: true } });
// }

// export async function invalidSessionById(sessionId: Session['id']) {
//   await prisma.session.update({ where: { id: sessionId }, data: { valid: false } });
// }

// export async function invalidSessionByUserId(userId: User['id']) {
//   await prisma.session.updateMany({
//     where: { user: { id: userId }, valid: true },
//     data: { valid: false },
//   });
// }

/*****************************************************************************
 * JWT Services
 *****************************************************************************/
export type AccessTokenPayload = Pick<User, 'id' | 'username'>;

export function signAccessToken(user: AccessTokenPayload) {
  const accessToken = signJwt(user, process.env.ACCESS_SECRET ?? 'access secret key', {
    expiresIn: process.env.ACCESS_EXPIRES ?? '15m',
  });

  return accessToken;
}

export function verifyAccessToken(token: string) {
  return verifyJwt<AccessTokenPayload>(token, process.env.ACCESS_SECRET ?? 'access secret key');
}

export interface RefreshTokenPayload {
  session: Session['id'];
}

export async function signRefreshToken(userId: User['id']) {
  const session = await createSession(userId);

  const refreshToken = signJwt(
    { session: session.id },
    process.env.REFRESH_SECRET ?? 'refresh secret key',
    { expiresIn: process.env.REFRESH_EXPIRES ?? '1y' },
  );

  return refreshToken;
}

export function verifyRefreshToken(token: string) {
  return verifyJwt<RefreshTokenPayload>(token, process.env.REFRESH_SECRET ?? 'refresh secret key');
}