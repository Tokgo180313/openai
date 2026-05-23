import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  UploadFileQueryDto,
  UploadFileSaveOptionsDto,
  UploadFileUpdateDto,
} from './dto/upload-file.dto';
import { UploadFileService } from './upload-file.service';

@ApiTags('upload-file')
@Controller('/upload-file')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class UploadFileController {
  constructor(private readonly uploadFileService: UploadFileService) {}

  /** 上传并暂存：落盘 uploads/，写入 upload_file，status=temp，返回 fileId */
  @Post('/save')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        source: {
          type: 'string',
          enum: ['user_upload', 'ai_generated', 'system_generated'],
        },
        metadata: { type: 'object' },
      },
    },
  })
  async save(
    @UploadedFile()
    file: { buffer: Buffer; originalname?: string; mimetype?: string },
    @Body() options: UploadFileSaveOptionsDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    return await this.uploadFileService.save(file, userId, options);
  }

  @Put('/update')
  async update(
    @Body() dto: UploadFileUpdateDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.uploadFileService.update(dto, userId);
  }

  @Post('/findList')
  async findList(
    @Body() dto: UploadFileQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.uploadFileService.findList(dto, userId);
  }

  @Get('/findById')
  @ApiQuery({ name: 'id', required: true })
  async findById(
    @Query('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const fileId = this.parseQueryId(id);
    return await this.uploadFileService.findById(fileId, userId);
  }

  @Delete('/deleteById')
  @ApiQuery({ name: 'id', required: true })
  async deleteById(
    @Query('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const fileId = this.parseQueryId(id);
    await this.uploadFileService.deleteById(fileId, userId);
    return { ok: true };
  }

  @Put('/markUsed')
  @ApiQuery({ name: 'id', required: true })
  async markUsed(
    @Query('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const fileId = this.parseQueryId(id);
    return await this.uploadFileService.markUsed(fileId, userId);
  }

  @Get('/:fileId/download')
  async download(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const id = this.parseQueryId(fileId);
    const download = await this.uploadFileService.getDownloadStream(id, userId);
    res.setHeader('Content-Type', download.contentType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(download.filename)}"`,
    );
    if (download.length > 0) {
      res.setHeader('Content-Length', String(download.length));
    }
    download.stream.pipe(res);
  }

  private parseQueryId(raw: string): number {
    const id = Number(String(raw ?? '').trim());
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('invalid file id');
    }
    return id;
  }
}
