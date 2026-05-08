import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TaskImageService } from './taskImage.service';

@ApiTags('taskImage')
@Controller('/taskImage')
export class TaskImageController {
  constructor(private readonly taskImageService: TaskImageService) {}
}
