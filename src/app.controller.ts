import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
@Controller("/ai")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/test")
  getHello(): string {
     return this.appService.getHello()

  }
}
