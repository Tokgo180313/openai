import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserDto } from './dto/UserDto';
import { PasswordUtil } from 'src/common/utils/password.utils';
import { PaginationDto } from './dto/PaginationDto';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { RecordService } from 'src/record/record.service';
import { RecordEntity } from 'src/record/entity/record.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private recordService: RecordService,
  ) {}

  /** 新建用户未传 roleId 时的默认角色 */
  private static readonly ORDINARY_ROLE_ID = '2';

  /** 超级管理员等角色不参与上下级，不可绑定 parentId */
  private static readonly ROLE_IDS_WITHOUT_HIERARCHY = new Set(['0', '1']);

  private hierarchyApplies(roleId: string): boolean {
    return !UserService.ROLE_IDS_WITHOUT_HIERARCHY.has(roleId);
  }

  /**
   * 校验「标准 hyphenated 外形」8-4-4-4-12 十六进制。
   * 注意：`uuid` 包的 validate() 还会限制版本位与 RFC variant（第 4 段须以 8/9/a/b 开头），
   * 许多库生成的「形似 UUID」的主键若 variant 不符会误判；此处仅做字符串形态校验。
   */
  private static readonly UUID_STRING_SHAPE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private isUuid(value: string): boolean {
    return UserService.UUID_STRING_SHAPE.test(value);
  }

  private parseOptionalParentRef(value: string | undefined): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const v = value.trim();
    if (!this.isUuid(v)) {
      throw new BadRequestException('无效的 parentId（需为 UUID）');
    }
    return v;
  }

  /** 除 roleId 为 0、1 外均可绑定 parentId */
  private assertParentAllowedForRole(
    roleId: string,
    parentId: string | null,
  ): void {
    if (parentId == null) return;
    if (!this.hierarchyApplies(roleId)) {
      throw new BadRequestException(
        '角色 0、1 不参与上下级，不可设置 parentId',
      );
    }
  }

  private async validateParentChain(
    userId: string | undefined,
    parentId: string | null,
  ): Promise<void> {
    if (parentId == null) return;
    const parent = await this.userRepo.findOne({
      where: { id: parentId },
      select: ['id', 'parentId'],
    });
    if (!parent) {
      throw new BadRequestException('上级用户不存在');
    }
    if (userId != null && parentId === userId) {
      throw new BadRequestException('上级不能为自己');
    }
    if (userId == null) return;
    let cursor: string | null = parentId;
    const seen = new Set<string>();
    while (cursor != null) {
      if (cursor === userId) {
        throw new BadRequestException('不能形成循环上下级');
      }
      if (seen.has(cursor)) break;
      seen.add(cursor);
      const row = await this.userRepo.findOne({
        where: { id: cursor },
        select: ['id', 'parentId'],
      });
      cursor = row?.parentId ?? null;
    }
  }

  async create(userDto: UserDto): Promise<User> {
    try {
      if (!userDto.account) {
        throw new BadRequestException('账号必填');
      }
      const existingUser = await this.userRepo.findOne({
        where: { account: userDto.account },
      });
      if (existingUser) {
        throw new ConflictException('账号已存在');
      }
      const roleId =
        userDto.roleId !== undefined && userDto.roleId !== null
          ? userDto.roleId
          : UserService.ORDINARY_ROLE_ID;
      const parentId = this.parseOptionalParentRef(userDto.parentId);
      this.assertParentAllowedForRole(roleId, parentId);
      await this.validateParentChain(undefined, parentId);

      const initialPlain = process.env.INITIAL_PASSWORD || '123456!';
      const hashed = await PasswordUtil.hash(initialPlain);
      const entity = this.userRepo.create({
        account: userDto.account,
        password: hashed,
        roleId,
        passwordType: '0',
        nickName: userDto.nickName,
        avatar: userDto.avatar,
        parentId,
      });
      const savedUser = await this.userRepo.save(entity);
      return savedUser;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException((error as Error).message);
    }
  }

  async findAll(pagination: PaginationDto): Promise<PaginationResponse<User>> {
    const { skip, limit, name } = pagination;
    const qb = this.userRepo.createQueryBuilder('user').skip(skip).take(limit);
    if (name) {
      qb.andWhere('user.account LIKE :name', { name: `%${name}%` });
    }
    const [data, total] = await qb.getManyAndCount();
    return {
      list: data,
      total,
      currentPage: skip / limit + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userDto: UserDto): Promise<User | null> {
    const where: FindOptionsWhere<User> = {};
    if (userDto.id !== undefined && userDto.id !== '') {
      const id = userDto.id.trim();
      if (this.isUuid(id)) where.id = id;
    }
    if (userDto.account !== undefined) where.account = userDto.account;
    if (userDto.roleId !== undefined) where.roleId = userDto.roleId;
    if (userDto.nickName !== undefined) where.nickName = userDto.nickName;
    if (userDto.parentId !== undefined && userDto.parentId !== '') {
      const p = userDto.parentId.trim();
      if (this.isUuid(p)) where.parentId = p;
    }
    if (Object.keys(where).length === 0) {
      return null;
    }
    return this.userRepo.findOne({ where });
  }

  async findUserByAccountWithPassword(account: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.account = :account', { account })
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    const v = id?.trim();
    if (!v || !this.isUuid(v)) {
      return null;
    }
    return this.userRepo.findOne({ where: { id: v } });
  }

  async deleteById(id: string, _operatorId: string): Promise<string> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (user.roleId === '0') {
      throw new ConflictException('超级管理员不能删除');
    }
    const childCount = await this.userRepo.count({
      where: { parentId: user.id },
    });
    if (childCount > 0) {
      throw new ConflictException('存在下级用户，无法删除');
    }
    const account = user.account;
    await this.userRepo.delete(user.id);
    return account;
  }

  async updatePassword(
    id: string,
    newPassword: string,
    operatorId: string,
  ): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('用户不存在');
    }
    const hashPassword = await PasswordUtil.hash(newPassword);
    const result = await this.userRepo.update(existing.id, {
      password: hashPassword,
      passwordType: '1',
    });
    if (!result.affected) {
      throw new NotFoundException('用户不存在');
    }
    const updated = await this.findById(id);
    if (updated) {
      await this.addRecord(updated.account, '密码修改', operatorId);
    }
  }

  async updateUser(userDto: UserDto, operatorId: string): Promise<User> {
    if (!userDto.id) {
      throw new BadRequestException('用户 id 必填');
    }
    const userId = userDto.id.trim();
    if (!this.isUuid(userId)) {
      throw new BadRequestException('无效的用户 id（需为 UUID）');
    }

    const existingBefore = await this.findById(userId);
    if (!existingBefore) {
      throw new NotFoundException('用户不存在');
    }

    const nextRoleId =
      userDto.roleId !== undefined ? userDto.roleId : existingBefore.roleId;

    let nextParentId = existingBefore.parentId;
    if (userDto.parentId !== undefined) {
      nextParentId = this.parseOptionalParentRef(userDto.parentId);
    }
    if (!this.hierarchyApplies(nextRoleId)) {
      nextParentId = null;
    }

    this.assertParentAllowedForRole(nextRoleId, nextParentId);
    await this.validateParentChain(userId, nextParentId);

    const payload: Partial<User> = {};
    if (userDto.account !== undefined) payload.account = userDto.account;
    if (userDto.roleId !== undefined) payload.roleId = userDto.roleId;
    if (userDto.passwordType !== undefined) payload.passwordType = userDto.passwordType;
    if (userDto.nickName !== undefined) payload.nickName = userDto.nickName;
    if (userDto.avatar !== undefined) payload.avatar = userDto.avatar;
    if (userDto.parentId !== undefined || userDto.roleId !== undefined) {
      payload.parentId = nextParentId;
    }

    if (userDto.password) {
      payload.password = await PasswordUtil.hash(userDto.password);
      payload.passwordType = '1';
    }

    if (Object.keys(payload).length === 0) {
      const existing = await this.findById(userId);
      if (!existing) throw new NotFoundException('用户不存在');
      return existing;
    }

    const result = await this.userRepo.update(userId, payload);
    if (!result.affected) {
      throw new NotFoundException('用户不存在');
    }
    const updateUser = await this.findById(userId);
    if (!updateUser) {
      throw new NotFoundException('用户不存在');
    }
    return updateUser;
  }

  async resetUser(userDto: UserDto): Promise<User> {
    if (!userDto.id) {
      throw new BadRequestException('用户 id 必填');
    }
    const userId = userDto.id.trim();
    if (!this.isUuid(userId)) {
      throw new BadRequestException('无效的用户 id（需为 UUID）');
    }

    const hashed = await PasswordUtil.hash(process.env.INITIAL_PASSWORD || '123456!');
    const result = await this.userRepo.update(userId, {
      password: hashed,
      passwordType: '',
    });
    if (!result.affected) {
      throw new NotFoundException('重置失败');
    }
    const updateUser = await this.findById(userId);
    if (!updateUser) {
      throw new NotFoundException('重置失败');
    }
    return updateUser;
  }

  async validateUser(account: string, password: string): Promise<User | null> {
    const user = await this.findUserByAccountWithPassword(account);
    if (user && (await PasswordUtil.compare(password, user.password))) {
      const { password: _p, ...rest } = user;
      void _p;
      return rest as User;
    }
    return null;
  }

  async updateNickName(id: string, nickName: string): Promise<User> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('用户不存在');
    }
    const result = await this.userRepo.update(existing.id, { nickName });
    if (!result.affected) {
      throw new NotFoundException('用户不存在');
    }
    const updateUser = await this.findById(id);
    if (!updateUser) {
      throw new NotFoundException('用户不存在');
    }
    return updateUser;
  }

  async addRecord(
    account: string,
    description: string,
    operatorId: string,
  ): Promise<void> {
    try {
      const user = await this.findById(operatorId);
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
      throw new BadRequestException((error as Error).message);
    }
  }
}
