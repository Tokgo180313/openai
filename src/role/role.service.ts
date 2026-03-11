import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../schemas/role/role.schema';
import { RoleDto } from './dto/role.dto';
import { FilterQuery } from 'mongoose';
@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private roleSchema: Model<RoleDocument>,
  ) {}
  //添加
  async createRole(roleDto: Role): Promise<Role> {
    const createRole = new this.roleSchema(roleDto);
    return await createRole.save();
  }
  //查询
  async findRoleList(roleDto: RoleDto): Promise<Role[]> {
    const query: FilterQuery<Role> = {};
    if (roleDto.name && roleDto.name !== '') {
      query.name = { $regex: roleDto.name, $options: 'i' };
    }
    if (roleDto.status && roleDto.status !== '') {
      query.status = roleDto.status;
    }
    return await this.roleSchema.find(query).exec();
  }
 
  //停止
  async stopRole(id: string): Promise<void> {
    await this.roleSchema
      .updateOne({ _id: id }, { $set: { status: "0" } })
      .exec();
  }
  //启动
  async startRole(id: string): Promise<void> {
    await this.roleSchema
      .updateOne({ _id: id }, { $set: { status: "1" } })
      .exec();
  }
}
