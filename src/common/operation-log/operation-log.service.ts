import { Injectable, NotFoundException } from '@nestjs/common';
import { RecordService } from 'src/record/record.service';
import { UserService } from 'src/user/user.service';

/** 与 UserController.appendOperationLog 一致：操作用户昵称/账号 + description（可选 `:目标`） */
@Injectable()
export class OperationLogService {
  constructor(
    private readonly userService: UserService,
    private readonly recordService: RecordService,
  ) {}

  async append(
    operatorId: string | undefined,
    action: string,
    target?: string,
  ): Promise<void> {
    const oid = operatorId?.trim();
    if (!oid) return;
    const op = await this.userService.findById(oid);
    if (!op) {
      throw new NotFoundException('记录失败，操作用户不存在');
    }
    const description =
      target != null && target !== '' ? `${action}:${target}` : action;
    await this.recordService.createRecord({
      nickName: op.nickName ?? '',
      account: op.account,
      description,
    });
  }
}
