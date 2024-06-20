import { User } from '../entities/user.entity'
import { Request } from 'express'

export interface TokenPayload {
  name: string
  sub: number
  type: JwtType
}

export interface Tokens {
  accessToken: string
  refreshToken: string
}

export type JwtPayloadWithRt = TokenPayload & { refresh_token: string }

export interface RequestWithUser extends Request {
  user: User
}

export enum JwtType {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
}

export enum CookieType {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
}