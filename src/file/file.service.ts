import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileDocument, FileSchema } from 'src/schemas/file/file.schema';

@Injectable()
export class FileService {
  constructor(
    @InjectModel(File.name) private fileSchema: Model<FileDocument>,
  ) {}

  uploadImage() {}

  uploadDocument() {}
}
