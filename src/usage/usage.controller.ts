import { Body, Controller, Delete, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsageService } from './usage.service';
import { UsageDto } from './dto/usage.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('usage')
@Controller('/usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Post('/findUsageList')
  @UseGuards(JwtAuthGuard)
  async findUsageList(
    @Body() usageDto: UsageDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.usageService.findUsageList(usageDto, userId);
  }
  @Delete('/deleteById')
  async deleteById(@Query('id') id: string, @CurrentUser('id') userId: string) {
    return await this.usageService.deleteById(id, userId);
  }
}