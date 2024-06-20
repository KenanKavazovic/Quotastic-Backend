import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
  } from '@nestjs/common'
  import { ConfigService } from '@nestjs/config'
  import { JwtService } from '@nestjs/jwt'
  import { User } from '../../entities/user.entity'
  import { Request, Response } from 'express'
  import { PostgresErrorCode } from '../../helpers/postgresErrorCodes.enum'
  import { CookieType, JwtType, TokenPayload } from '../../interfaces/auth.interface'
  import { UserData } from '../../interfaces/user.interface'
  import { UsersService } from '../users/users.service'
  import { compareHash, hash } from '../../utils/bcrypt'
  import { RegisterUserDto } from './dto/register-user.dto'
  import { Repository } from 'typeorm'
  import { InjectRepository } from '@nestjs/typeorm'
  import Logging from '../../library/Logging'
  import * as bcrypt from 'bcrypt';

  @Injectable()
  export class AuthService {
    constructor(
      @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
      @InjectRepository(User) private readonly usersRepository: Repository<User>,
      private jwtService: JwtService,
      private configService: ConfigService,
    ) {}
  
    async validateUser(email: string, password: string): Promise<User> {
      Logging.log('Validating user...');
      const user = await this.usersService.findBy({ email: email });
      if (!user) {
        throw new BadRequestException('Invalid credentials.');
      }
      if (!(await compareHash(password, user.password))) {
        throw new BadRequestException('Invalid credentials.');
      }
      Logging.log('User is valid.');
      const refreshToken = await this.generateToken(user.id, user.email, JwtType.REFRESH_TOKEN);
      await this.updateRtHash(user.id, refreshToken);
      return user;
    }
  
    async register(registerUserDto: RegisterUserDto): Promise<User> {
      if (await this.usersService.findBy({ email: registerUserDto.email })) {
        throw new BadRequestException('User with this email already exists');
      } else {
        const hashedPassword: string = await hash(registerUserDto.password);
        const user = await this.usersService.create({
          ...registerUserDto,
          password: hashedPassword,
          refresh_token: null,
        });
        const refreshToken = await this.generateToken(user.id, user.email, JwtType.REFRESH_TOKEN);
        await this.updateRtHash(user.id, refreshToken);
        return user;
      }
    } 
  
    async login(userFromRequest: User, res: Response): Promise<void> {
      const user = await this.usersService.findById(userFromRequest.id);
      const accessToken = await this.generateToken(user.id, user.email, JwtType.ACCESS_TOKEN);
      const accessTokenCookie = await this.generateCookie(accessToken, CookieType.ACCESS_TOKEN);
      const refreshTokenCookie = await this.generateCookie(user.refresh_token, CookieType.REFRESH_TOKEN);
      try {
        res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]).json({ ...user });
      } catch (error) {
        Logging.error(error);
        throw new InternalServerErrorException('Something went wrong while setting cookies into response header.');
      }
    }
    
    async signout(userId: number, res: Response): Promise<void> {
      const user = await this.usersService.findById(userId)
      await this.usersService.update(user.id, { refreshToken: null })
      try {
        res.setHeader('Set-Cookie', this.getCookiesForSignOut()).sendStatus(200)
      } catch (error) {
        Logging.error(error)
        throw new InternalServerErrorException('Something went wrong while setting cookies into response header.')
      }
    }
  
    async refreshTokens(req: Request): Promise<User> {
      const user = await this.usersService.findBy({ refreshToken: req.cookies.refreshToken });
      if (!user) {
        throw new ForbiddenException();
      }
      try {
        await this.jwtService.verifyAsync(user.refreshToken, {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        });
      } catch (error) {
        Logging.error(error);
        throw new UnauthorizedException('Something went wrong while refreshing tokens.');
      }
      const newRefreshToken = await this.generateToken(user.id, user.email, JwtType.REFRESH_TOKEN);
      await this.updateRtHash(user.id, newRefreshToken);
      const token = await this.generateToken(user.id, user.email, JwtType.ACCESS_TOKEN);
      const cookie = await this.generateCookie(token, CookieType.ACCESS_TOKEN);
      try {
        req.res.setHeader('Set-Cookie', cookie);
      } catch (error) {
        Logging.error(error);
        throw new InternalServerErrorException('Something went wrong while setting cookies into the response header.');
      }
      return user;
    }    
  
    async updateRtHash(userId: number, rt: string): Promise<void> {
      try {
        const hashedToken = await bcrypt.hash(rt, 10);
        const user = await this.usersService.findById(userId);
        user.refreshToken = hashedToken;
        await this.usersRepository.save(user);
      } catch (error) {
        Logging.error(error);
        throw new InternalServerErrorException('Something went wrong while updating the refresh token.');
      }
    }
    
    async getUserIfRefreshTokenMatches(refreshToken: string, userId: number): Promise<UserData> {
      const user = await this.usersService.findById(userId)
      const isRefreshTokenMatching = await compareHash(refreshToken, user.refresh_token)
      if (isRefreshTokenMatching) {
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      }
    }
  
    async generateToken(userId: number, email: string, type: JwtType): Promise<string> {
      try {
        const payload: TokenPayload = { sub: userId, name: email, type };
        let token: string;
        switch (type) {
          case JwtType.REFRESH_TOKEN:
            token = await this.jwtService.signAsync(payload, {
              secret: this.configService.get('JWT_REFRESH_SECRET'),
              expiresIn: this.configService.get('JWT_REFRESH_SECRET_EXPIRES'),
            });
            break;
          case JwtType.ACCESS_TOKEN:
            token = await this.jwtService.signAsync(payload, {
              secret: this.configService.get('JWT_SECRET'),
              expiresIn: this.configService.get('JWT_SECRET_EXPIRES'),
            });
            break;
          default:
            throw new BadRequestException('Permission denied.');
        }
        return token;
      } catch (error) {
        Logging.error(error);
        if (error?.code === PostgresErrorCode.UniqueViolation) {
          throw new BadRequestException('User with that email already exists.');
        }
        throw new InternalServerErrorException('Something went wrong while generating a new token.');
      }
    }
    
    async generateCookie(token: string, type: CookieType): Promise<string> {
      try {
        let cookie: string
        switch (type) {
          case CookieType.REFRESH_TOKEN:
            cookie = `refresh_token=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
              'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
            )}; SameSite=None; Secure`
            break
          case CookieType.ACCESS_TOKEN:
            cookie = `access_token=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
              'JWT_EXPIRATION_TIME',
            )}; SameSite=None; Secure`
            break
          default:
            throw new BadRequestException('Permission denied.')
        }
        return cookie
      } catch (error) {
        Logging.error(error)
        throw new InternalServerErrorException('Something went wrong while generating a new cookie.')
      }
    }
  
    getCookiesForSignOut(): string[] {
      return ['access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure', 'refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure']
    }
  }