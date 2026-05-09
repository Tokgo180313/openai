import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto, RoleDto } from './dto/role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async createRole(roleDto: CreateRoleDto): Promise<Role> {
    const existed = await this.roleRepo.findOne({
      where: { roleId: roleDto.roleId },
    });
    if (existed) {
      throw new ConflictException('角色编码已存在');
    }
    const entity = this.roleRepo.create(roleDto);
    return await this.roleRepo.save(entity);
  }

  async findRoleList(roleDto: RoleDto): Promise<Role[]> {
    const qb = this.roleRepo.createQueryBuilder('role');
    if (roleDto.status && roleDto.status !== '') {
      qb.andWhere('role.status = :status', { status: roleDto.status });
    }
    if (roleDto.name && roleDto.name !== '') {
      qb.andWhere('role.name LIKE :name', { name: `%${roleDto.name}%` });
    }
    return qb.getMany();
  }

  async findRoleById(id: string): Promise<Role | null> {
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      return null;
    }
    return await this.roleRepo.findOne({ where: { id: numId } });
  }

  async stopRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    if (role.roleId === '0') {
      throw new ConflictException('超级管理员不能停止');
    }
    const numId = Number(id);
    await this.roleRepo.update(numId, { status: '0' });
  }

  async startRole(id: string): Promise<void> {
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      return;
    }
    await this.roleRepo.update(numId, { status: '1' });
  }
}
