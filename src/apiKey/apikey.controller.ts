import { Controller, Delete, Post, Put } from "@nestjs/common";
import { ApiKeyService } from "./apiKey.service";
import { ApiKeyDto } from "./dto/apiKey.dto";
import { ApiTags } from "@nestjs/swagger";
import { ApiKeyEntity } from "./entity/apiKey.entity";

@ApiTags("apiKey")
@Controller("/apiKey")
export class ApiKeyController {
    constructor(private readonly apiKeyService: ApiKeyService) {}

    // 添加API Key
    @Put("/add")
    async addApiKey(apiKeyDto: ApiKeyDto) {
        return await this.apiKeyService.createApiKey(apiKeyDto);
    }

    // 查询API Key列表
    @Post("/findList")
    async findApiKeyList(apiKeyDto: ApiKeyDto) {
        return await this.apiKeyService.findApiKeyList(apiKeyDto);
    }

    // 删除API Key
    @Delete("/delete")
    async deleteApiKey(id: string) {
        return await this.apiKeyService.deleteApiKey(id);
    }
}