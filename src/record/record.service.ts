import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RecordDto } from './dto/record.dto';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';
import { RecordEntity } from './entity/record.entity';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { OperationRecord } from './entities/operation-record.entity';
import { User } from 'src/user/entities/user.entity';
import { RbacService } from 'src/rbac/rbac.service';
import { FULL_ACCESS_ROLE_IDS } from 'src/rbac/constants/role.constants';

@Injectable()
export class RecordService {
  constructor(
    @InjectRepository(OperationRecord)
    private readonly recordRepo: Repository<OperationRecord>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly rbacService: RbacService,
  ) {}

  async createRecord(recordDto: RecordEntity): Promise<OperationRecord> {
    const entity = this.recordRepo.create({
      nickName: recordDto.nickName,
      account: recordDto.account,
      description: recordDto.description,
    });
    return await this.recordRepo.save(entity);
  }

  /** 自己及所有下级用户 id（BFS 按 parent_id 链） */
  private async collectSelfAndDescendantIds(rootId: string): Promise<string[]> {
    const ids = new Set<string>([rootId]);
    let frontier: string[] = [rootId];
    while (frontier.length > 0) {
      const children = await this.userRepo.find({
        where: { parentId: In(frontier) },
        select: ['id'],
      });
      const next: string[] = [];
      for (const c of children) {
        if (!ids.has(c.id)) {
          ids.add(c.id);
          next.push(c.id);
        }
      }
      frontier = next;
    }
    return [...ids];
  }

  async findRecordList(
    recordDto: RecordDto,
    viewerUserId: string,
  ): Promise<PaginationResponse<OperationRecord>> {
    const viewer = await this.userRepo.findOne({
      where: { id: viewerUserId },
      select: ['id'],
    });
    if (!viewer) {
      throw new NotFoundException('用户不存在');
    }

    const qb = this.recordRepo.createQueryBuilder('r');

    const roleId = await this.rbacService.getPrimaryRoleId(viewerUserId);
    const scopeAll = roleId != null && FULL_ACCESS_ROLE_IDS.has(roleId);
    if (!scopeAll) {
      const visibleIds = await this.collectSelfAndDescendantIds(viewer.id);
      const users = await this.userRepo.find({
        where: { id: In(visibleIds) },
        select: ['account'],
      });
      const accounts = users.map((u) => u.account).filter(Boolean);
      if (accounts.length === 0) {
        qb.andWhere('1 = 0');
      } else {
        qb.andWhere('r.account IN (:...visibleAccounts)', {
          visibleAccounts: accounts,
        });
      }
    }

    if (recordDto.account != null && recordDto.account.trim() !== '') {
      qb.andWhere('r.account LIKE :account', {
        account: `%${recordDto.account.trim()}%`,
      });
    }
    if (recordDto.description != null && recordDto.description.trim() !== '') {
      qb.andWhere('r.description LIKE :desc', {
        desc: `%${recordDto.description.trim()}%`,
      });
    }
    const day = recordDto.createdAt?.trim();
    if (day) {
      const dayStart = new Date(`${day}T00:00:00+08:00`);
      const dayEnd = new Date(`${day}T23:59:59.999+08:00`);
      if (
        !Number.isNaN(dayStart.getTime()) &&
        !Number.isNaN(dayEnd.getTime())
      ) {
        qb.andWhere('r.createdAt BETWEEN :dayStart AND :dayEnd', {
          dayStart,
          dayEnd,
        });
      }
    } else {
      if (
        recordDto.createdAtStart != null &&
        recordDto.createdAtStart.trim() !== ''
      ) {
        const d = new Date(recordDto.createdAtStart);
        if (!Number.isNaN(d.getTime())) {
          qb.andWhere('r.createdAt >= :createdAtStart', {
            createdAtStart: d,
          });
        }
      }
      if (
        recordDto.createdAtEnd != null &&
        recordDto.createdAtEnd.trim() !== ''
      ) {
        const d = new Date(recordDto.createdAtEnd);
        if (!Number.isNaN(d.getTime())) {
          qb.andWhere('r.createdAt <= :createdAtEnd', {
            createdAtEnd: d,
          });
        }
      }
    }

    const { skip, limit } = recordDto;
    const [data, total] = await qb
      .orderBy('r.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      list: data,
      total,
      currentPage: recordDto.page,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async deleteRecord(id: string): Promise<void> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      return;
    }
    await this.recordRepo.delete(nid);
  }
}
