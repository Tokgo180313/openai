import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileService } from './file.service';
import { DeleteInputImageDto } from './dto/delete-input-image.dto';
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
      required: ['file', 'fileName', 'documentId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        uploadId: { type: 'string', description: '可选，前端自定义上传标识' },
        documentId: { type: 'string', description: '文件归档标识' },
        fileName: { type: 'string' },
        mimeType: { type: 'string' },
      },
    },
  })
  public async uploadFile(
    @UploadedFile()
    file: { buffer: Buffer; originalname?: string; mimetype?: string },
    @Body('uploadId') uploadId: string,
    @Body('documentId') documentId: string,
    @Body('fileName') fileName: string,
    @Body('mimeType') mimeType: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    if (!fileName) {
      throw new BadRequestException('fileName is required');
    }
    if (!documentId) {
      throw new BadRequestException('documentId is required');
    }
    return this.fileService.uploadFileChunk(
      {
        file,
        uploadId,
        documentId,
        fileName,
        mimeType,
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

  /** 上传图片到本地 inputImages 目录，返回绝对路径 localPath */
  @Post('/uploadImages')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  public async uploadInputImage(
    @UploadedFile()
    file: { buffer: Buffer; originalname?: string; mimetype?: string },
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    return this.fileService.uploadInputImage(file, userId);
  }

  /** 根据上传接口返回的本地路径删除文件 */
  @Delete('/inputImages')
  public async deleteInputImage(
    @Body() dto: DeleteInputImageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.fileService.deleteInputImageByLocalPath(dto.localPath, userId);
  }

  /** 根据 localPath 读取图片流（inputImages 或 resultImages 下当前用户目录）；查询参数需 URL 编码 */
  @Get('/inputImages/by-local-path')
  @ApiQuery({
    name: 'localPath',
    required: true,
    description:
      '绝对路径：POST /file/uploadImages 的 localPath，或 task_image.resultImages 中的路径',
  })
  public async getInputImageByLocalPath(
    @Query('localPath') localPath: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const file = await this.fileService.getInputImageFileByLocalPath(
      localPath,
      userId,
    );
    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.filename)}"`,
    );
    res.setHeader('Content-Length', String(file.length));
    file.stream.pipe(res);
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