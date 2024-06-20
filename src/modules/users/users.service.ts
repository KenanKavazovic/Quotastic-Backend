import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostgresErrorCode } from '../../helpers/postgresErrorCodes.enum';
import { AbstractService } from '../common/abstract.service';
import { Repository } from 'typeorm';
import { compareHash, hash } from '../../utils/bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { join } from 'path';
import { User } from '../../entities/user.entity';
import Logging from '../../library/Logging';
import * as fs from 'fs';

@Injectable()
export class UsersService extends AbstractService {
  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {
    super(usersRepository)
  }

  async create(registerUserDto: RegisterUserDto): Promise<User> {
    const user = await this.findBy({ email: registerUserDto.email })
    if (user) {
      throw new BadRequestException('User with that email already exists.')
    }
    try {
      const newUser = this.usersRepository.create(registerUserDto)
      return this.usersRepository.save(newUser)
    } catch (error) {
      Logging.error(error)
      throw new BadRequestException('Something went wrong while creating a new user.')
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = (await this.findById(id)) as User
    const { email, current_password, password, confirm_password, ...data } = updateUserDto
    if (user.email !== email && email) {
      user.email = email
    }
    if (password && confirm_password) {
      if (password !== confirm_password) {
        throw new BadRequestException('Passwords do not match.')
      }
      else if (!(await compareHash(current_password, user.password))) {
        throw new BadRequestException('The password you entered is incorrect.')
      }
      else if (await compareHash(password, user.password)) {
        throw new BadRequestException('New password cannot be the same as your old password.')
      }
      else {
        user.password = await hash(password)
      }
    }
    try {
      Object.entries(data).map((entry) => {
        user[entry[0]] = entry[1]
      })
      return this.usersRepository.save(user)
    } catch (error) {
      Logging.error(error)
      if (error?.code === PostgresErrorCode.UniqueViolation) {
        throw new BadRequestException('User with that email already exists')
      }
      throw new InternalServerErrorException('Something went wrong while updating user data.')
    }
  }

  async uploadAvatar(userId: number, file: Express.Multer.File): Promise<string> {
    const fileSizeLimit = 5 * 1024 * 1024;
    if (file.size > fileSizeLimit) {
      throw new Error('File size exceeds the limit.');
    }

    const allowedFileTypes = ['.png', '.jpg', '.jpeg'];
    const fileExtension = file.originalname.split('.').pop();
    if (!allowedFileTypes.includes(`.${fileExtension}`)) {
      throw new Error('Invalid file type. Only PNG, JPG, and JPEG files are allowed.');
    }

    const uploadDir = join(process.cwd(), 'files', 'avatars');
    const avatarFileName = `${userId}-${file.originalname}`;
    const avatarFilePath = join(uploadDir, avatarFileName);
    
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user.avatar) {
      await fs.promises.unlink(avatarFilePath).catch((error) => {
        console.error('Error deleting file:', user.avatar, error);
      });
    }
    
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(avatarFilePath, file.buffer);
    
    return avatarFileName;
  }

  async updateAvatar(userId: number, avatarFileName: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    user.avatar = avatarFileName;
    return this.usersRepository.save(user);
  }

  async getAvatar(userId: number): Promise<string | undefined> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user && user.avatar) {
      const avatarPath = join(process.cwd(), 'files', 'avatars', user.avatar);
      return avatarPath;
    }
    return undefined;
  }
}