import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/login/dto/LoginDto';
import { UserDto } from 'src/user/dto/UserDto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}
  // 用户登录验证
  async validateUser(loginDto: LoginDto): Promise<any> {
    const { account, password } = loginDto;
    if (!account) {
      throw new UnauthorizedException('请输入用户名');
    }
    const user = await this.userService.validateUser(account, password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return user;
  }
  // 用户登录
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);
    const payload = {
      account: user.account,
      sub: user._id,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
  // 用户注册
  async register(userDto: UserDto) {
    const user = await this.userService.create(userDto);
    const payload = {
      account: userDto.account,
      sub: user.id,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
  // 生成 Jwt Token
  async generateToken(user: any) {
    const payload = {
      account: user.account,
      sub: user._id || user.id,
    };
    return this.jwtService.sign(payload);
  }
}
