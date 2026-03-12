import { Injectable } from "@nestjs/common";
import { Model, FilterQuery } from "mongoose";
import { Usage, UsageDocument } from "src/schemas/usage/usage.schema";
import { PaginationResponse } from "src/interfaces/pagination.interface";
import { RecordService } from "src/record/record.service";
import { UserService } from "src/user/user.service";
import { UsageDto } from "./dto/usage.dto";
import { NotFoundException } from "@nestjs/common";
import { UsageEntity } from "./entity/usage.entity";
import { RecordEntity } from "src/record/entity/record.entity";
import { InjectModel } from "@nestjs/mongoose";
@Injectable()
export class UsageService { 
    constructor(@InjectModel(Usage.name) private usageSchema: Model<UsageDocument>, private readonly recordService: RecordService, private readonly userService: UserService){}

    async findUsageList(usageDto: UsageDto): Promise<PaginationResponse<Usage>> {
        const { skip, limit } = usageDto;
        const query: FilterQuery<Usage> = {};
        if (usageDto.account) {
            query.account = usageDto.account;
        }
        if (usageDto.modelName) {
            query.modelName = usageDto.modelName;
        }
        if (usageDto.modelClassify) {
            query.modelClassify = usageDto.modelClassify;
        }
        if (usageDto.startTime) {
            query.startTime = usageDto.startTime;
        }
        if (usageDto.endTime) {
            query.endTime = usageDto.endTime;
        }
        const total = await this.usageSchema.countDocuments(query).exec();
        const data = await this.usageSchema.find(query).skip(skip).limit(limit).exec();
        return {
            list: data,
            total,
            currentPage: skip / limit + 1,
            totalPages: Math.ceil(total / limit),
        };
    }
    async deleteById(id: string, userId: string): Promise<void> {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new NotFoundException('user not found');
        }
        await this.usageSchema.findByIdAndDelete(id).exec();
        const record: RecordEntity = {
            nickName: user.nickName,
            account: user.account,
            description: 'usage deleted: ' + id,
        };
        this.recordService.createRecord(record);
    }
    async addUsage(usageDto: UsageEntity,id:string): Promise<Usage> {
        const user = await this.userService.findById(id);
        if (!user) {
            throw new NotFoundException('user not found');
        }
        const usage: UsageEntity = {
            nickName: user.nickName,
            account: user.account,
            modelName: usageDto.modelName,
            modelClassify: usageDto.modelClassify,
            promptTokens: usageDto.promptTokens,
            completionTokens: usageDto.completionTokens,
            totalTokens: usageDto.totalTokens,
            description: usageDto.description,
            status: "0",
        };
        return await this.usageSchema.create(usage);
    }

    async updateUsage(id: string, status: string): Promise<Usage> {
        const usage = await this.usageSchema.findByIdAndUpdate(id, {status}, { new: true }).exec();
        if (!usage) {
            throw new NotFoundException('usage not found');
        }
        return usage;
    }
}