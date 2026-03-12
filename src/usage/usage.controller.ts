import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PaginationDto } from "src/user/dto/PaginationDto";
import { UsageService } from "./usage.service";
import { UsageDto } from "./dto/usage.dto";
import { Body, Post ,Delete, Query} from "@nestjs/common";
import { UsageEntity } from "./entity/usage.entity";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
@ApiTags('usage')
@Controller('/usage')
export class UsageController {  
    constructor(private readonly usageService: UsageService){}

    @Post('/findUsageList')
    async findUsageList(@Body() usageDto: UsageDto){
        return await this.usageService.findUsageList(usageDto)
    }
    @Delete('/deleteById')
    async deleteById(@Query('id') id: string, @CurrentUser('id') userId: string){
        return await this.usageService.deleteById(id, userId)
    }
}