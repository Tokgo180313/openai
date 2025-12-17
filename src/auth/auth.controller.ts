import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/login/dto/LoginDto';
import { UserDto } from 'src/user/dto/UserDto';
import { ApiTags } from '@nestjs/swagger';
import { Token } from 'src/common/decorators/token.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    // console.log("loginDto",this.authService.login(loginDto))
    return this.authService.login(loginDto);
  }

  @Post('/register')
  async register(@Body() userDto: UserDto) {
    return this.authService.register(userDto);
  }

  @Get('/validate')
  async validateToken(@Token() token: string) {
    return this.authService.validateToken(token);
  }
}
