import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/login/dto/LoginDto';
import { UserDto } from 'src/user/dto/UserDto';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';

/** 不含 password 字段的登录用户（TypeORM User 经 validateUser 剥离密码） */
export type AuthUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}
  // 用户登录验证
  async validateUser(loginDto: LoginDto): Promise<AuthUser> {
    const { account, password } = loginDto;
    if (!account) {
      throw new UnauthorizedException('请输入用户名');
    }
    const user = await this.userService.validateUser(account, password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return user as AuthUser;
  }
  // 用户登录
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);
    const token = this.jwtService.sign({
      account: user.account,
      sub: String(user.id),
    });
    return {
      access_token: token,
      user,
    };
  }
  // 用户注册
  async register(userDto: UserDto) {
    const user = await this.userService.create(userDto);
    const token = this.jwtService.sign({
      account: user.account,
      sub: String(user.id),
    });
    return {
      access_token: token,
      user,
    };
  }
  // 生成 Jwt Token
  async generateToken(user: Pick<User, 'id' | 'account'>) {
    return this.jwtService.sign({
      account: user.account,
      sub: String(user.id),
    });
  }
  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'my-secret-key',
      });
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token 已过期');
      }
      if (payload.nbf && payload.nbf > now) {
        throw new Error('Token 未生效');
      }

      if (payload.iss && payload.iss !== process.env.JWT_ISSUER) {
        throw new Error('无效的签发者');
      }

      return payload;
    } catch (error) {
      throw new Error('Token验证失败；' + error.message);
    }
  }
}
