import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user/user.schema';
import { UserDto } from './dto/UserDto';
import { PasswordUtil } from 'src/common/utils/password.utils';
import { PaginationDto } from './dto/PaginationDto';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { RecordService } from 'src/record/record.service';
import { Record } from 'src/schemas/record/record.schema';
import { RecordEntity } from 'src/record/entity/record.entity';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userSchema: Model<UserDocument>,
    private recordService: RecordService,
  ) {}

  //添加
  async create(userDto: UserDto, id?: string | undefined): Promise<User> {
    try {
      userDto.password = process.env.INITIAL_PASSWORD || '123456!';
      userDto.passwordType = '0';
      const existingUser = await this.userSchema.findOne({
        $or: [{ account: userDto.account }],
      });
      if (existingUser) {
        if (existingUser.account === userDto.account) {
          throw new ConflictException('账号已存在');
        }
      }
      const createUser = new this.userSchema(userDto);
      const savedUser = await createUser.save();
      if (id) {
        this.addRecord(savedUser.account, '用户添加', id);
      }
      return savedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  //查询
  async findAll(pagination: PaginationDto): Promise<PaginationResponse<User>> {
    const { skip, limit, name } = pagination;
    const query: any = {};
    if (name) {
      query.account = { $regex: name, $options: 'i' };
    }
    const total = await this.userSchema.countDocuments(query).exec();
    const data = await this.userSchema
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
    return {
      list: data,
      total,
      currentPage: skip / limit + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  //查找
  async findOne(userDto: UserDto): Promise<User | null> {
    return await this.userSchema.findOne(userDto);
  }
  // 根据账号查询用户，包含密码，用于验证
  async findUserByAccountWithPassword(
    account: string,
  ): Promise<UserDocument | null> {
    return this.userSchema.findOne({ account }).select('+password').exec();
  }
  // 根据ID查找用户
  async findById(id: string): Promise<User | null> {
    return await this.userSchema.findById(id).exec();
  }
  //删除
  async deleteById(id: string, userId: string): Promise<void> {
    let user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (user.roleId === '0') {
      throw new ConflictException('超级管理员不能删除');
    }
    await this.userSchema.findByIdAndDelete(id).exec();
    this.addRecord(user.account, '用户删除', userId, );
  }

  async updatePassword(
    id: string,
    newPassword: string,
    userId: string,
  ): Promise<void> {
    const hashPassword = await PasswordUtil.hash(newPassword);
    const result = await this.userSchema
      .findByIdAndUpdate(
        id,
        { password: hashPassword, passwordType: '1' },
        {
          new: true,
        },
      )
      .exec();
    if (!result) {
      throw new NotFoundException('用户不存在');
    }
    this.addRecord(result.account, '密码修改', userId);
  }
  async updateUser(userDto: UserDto, id: string): Promise<User> {
    if (userDto.password) {
      userDto.password = await PasswordUtil.hash(userDto.password);
      userDto.passwordType = '1';
    }
    const updateUser = await this.userSchema
      .findByIdAndUpdate(userDto.id, userDto, { new: true })
      .exec();
    if (!updateUser) {
      throw new NotFoundException('用户不存在');
    }
    this.addRecord(updateUser.account, '用户修改', id);
    return updateUser;
  }
  async resetUser(userDto: UserDto): Promise<User> {
    userDto.password = process.env.INITIAL_PASSWORD || '123456!';
    userDto.passwordType = '';
    const updateUser = await this.userSchema
      .findByIdAndUpdate(userDto.id, userDto, { new: true })
      .exec();
    if (!updateUser) {
      throw new NotFoundException('重置失败');
    }
    return updateUser;
  }
  // 验证用户
  async validateUser(account: string, password: string): Promise<User | null> {
    let user: UserDocument | null = null;
    user = await this.findUserByAccountWithPassword(account);
    if (user && (await user.validaterPassword(password))) {
      return user;
    }
    return null;
  }

  async updateNickName(id: string, nickName: string): Promise<User> {
    const updateUser = await this.userSchema
      .findByIdAndUpdate(id, { nickName: nickName }, { new: true })
      .exec();
    if (!updateUser) {
      throw new NotFoundException('用户不存在');
    }
    return updateUser;
  }

  async addRecord(
    account: string,
    description: string,
    id: string,
  ): Promise<void> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundException('记录失败，操作用户不存在');
      }
      const recordData: RecordEntity = {
        nickName: user.nickName,
        account: user.account,
        description: description + `:${account}`,
      };
      await this.recordService.createRecord(recordData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
