import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
  } from '@nestjs/common'
  import { GetCurrentUser } from '../../decorators/get-current-user.decorator'
  import { Public } from '../../decorators/public.decorator'
  import { User } from '../../entities/user.entity'
  import { Request, Response } from 'express'
  import { RequestWithUser } from '../../interfaces/auth.interface'
  import { UserData } from '../../interfaces/user.interface'
  import { AuthService } from './auth.service'
  import { RegisterUserDto } from './dto/register-user.dto'
  import { JwtAuthGuard, JwtRefreshAuthGuard, LocalAuthGuard, NotAuthGuard } from './guards'
  
  @Controller('auth')
  @UseInterceptors(ClassSerializerInterceptor)
  export class AuthController {
    constructor(private authService: AuthService) {}
  
    @Public()
    @UseGuards()
    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() body: RegisterUserDto): Promise<User> {
      return this.authService.register(body)
    }
  
    @Public()
    @UseGuards(LocalAuthGuard, )
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Req() req: RequestWithUser, @Res() res: Response): Promise<void> {
      return this.authService.login(req.user, res)
    }
  
    @UseGuards(JwtAuthGuard)
    @Post('signout')
    @HttpCode(HttpStatus.OK)
    async signout(@GetCurrentUser() userId: User, @Res() res: Response): Promise<void> {
      return this.authService.signout(userId.id, res)
    }
  
    @Public()
    @UseGuards(JwtRefreshAuthGuard)
    @Get('refresh')
    @HttpCode(HttpStatus.ACCEPTED)
    async refreshTokens(@Req() req: Request): Promise<User> {
      return this.authService.refreshTokens(req)
    }
  
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @HttpCode(HttpStatus.OK)
    async getCurrentUser(@GetCurrentUser() user: User): Promise<UserData> {
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
      }
    }
  }