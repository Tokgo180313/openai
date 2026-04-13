import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { Response } from 'express';

@ApiTags('file')
@Controller('/file')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('/uploadFile')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'fileName', 'totalChunks', 'chunkIndex'],
      properties: {
        file: { type: 'string', format: 'binary' },
        uploadId: { type: 'string', description: '首次可不传，服务端会返回' },
        fileName: { type: 'string' },
        mimeType: { type: 'string' },
        totalChunks: { type: 'number', example: 8 },
        chunkIndex: { type: 'number', example: 0 },
      },
    },
  })
  public async uploadFile(
    @UploadedFile()
    file: { buffer: Buffer; originalname?: string; mimetype?: string },
    @Body('uploadId') uploadId: string,
    @Body('fileName') fileName: string,
    @Body('mimeType') mimeType: string,
    @Body('totalChunks') totalChunks: number | string,
    @Body('chunkIndex') chunkIndex: number | string,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    if (!fileName) {
      throw new BadRequestException('fileName is required');
    }
    return this.fileService.uploadFileChunk(
      {
        file,
        uploadId,
        fileName,
        mimeType,
        totalChunks: Number(totalChunks),
        chunkIndex: Number(chunkIndex),
      },
      userId,
    );
  }

  @Get('/uploadStatus')
  public async uploadStatus(
    @Query('uploadId') uploadId: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!uploadId) {
      throw new BadRequestException('uploadId is required');
    }
    return this.fileService.getUploadStatus(uploadId, userId);
  }

  @Get('/:fileId/download')
  public async downloadFile(
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const download = await this.fileService.getDownloadFile(fileId, userId);
    res.setHeader('Content-Type', download.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(download.filename)}"`,
    );
    res.setHeader('Content-Length', String(download.length));
    download.stream.pipe(res);
  }
}