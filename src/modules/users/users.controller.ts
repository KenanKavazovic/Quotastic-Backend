import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseInterceptors,
  } from '@nestjs/common'
  import { Patch, Res, UploadedFile, UseGuards } from '@nestjs/common/decorators/index'
  import { User } from '../../entities/user.entity'
  import { UpdateUserDto } from './dto/update-user.dto'
  import { UsersService } from './users.service'
  import { JwtAuthGuard } from '../auth/guards'
  import { FileInterceptor } from '@nestjs/platform-express'
  import { GetCurrentUser } from 'src/decorators/get-current-user.decorator'
  import { Response } from "express";

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: number): Promise<User> {
    return this.usersService.findById(id)
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.update(id, updateUserDto)
  }
  
  @Post('uploadAvatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @GetCurrentUser() user: User,): Promise<User> {
    const avatarFileName = await this.usersService.uploadAvatar(user.id, file);
    return this.usersService.updateAvatar(user.id, avatarFileName);
  }
  
  @Get('avatar/:id')
  async getAvatar(@Param('id') userId: number, @Res() res: Response) {
    const avatarPath = await this.usersService.getAvatar(userId);
    if (!avatarPath) {
      return res.status(404).send();
    }
    return res.sendFile(avatarPath);
  }
}
