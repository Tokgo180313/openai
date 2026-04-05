import { Body, Controller, Delete, Get, Post, Put, Query } from "@nestjs/common";
import { ModelService } from "./models.service";
import { ModelsDto } from "./dto/models.dto";
import { ApiTags } from "@nestjs/swagger";
import { Models } from "src/schemas/models/models.schema";
import { ModelsEntity } from "./entity/models.entity";
@ApiTags("model")
@Controller("/model")
export class ModelController {
    constructor(private readonly modelService: ModelService){}

    @Put("/add")
    async addModel(@Body() modelDto: ModelsEntity) {
        return await this.modelService.createModel(modelDto);
    }

    @Post("/findModellist")
    async findModelList(@Body() modelDto:ModelsDto){
        return await this.modelService.findModelList(modelDto)
    }
    
    @Get("/findById")
    async findById(@Query("id") id:string){
        return await this.modelService.findModelById(id)
    }

    @Delete("/deleteById")
    async deleteById(@Query("id") id:string){
        return await this.modelService.deleteModel(id)
    }

    @Put("/disableById")
    async disableById(@Query("id") id: string) {
        return await this.modelService.disableModel(id);
    }

    @Put("/enableById")
    async enableById(@Query("id") id: string) {
        return await this.modelService.enableModel(id);
    }

    @Get("/findClassifyList")
    async findClassifyList(){
        return await this.modelService.findClassifyList()
    }

    /** 根据 modelClassify 使用对应密钥调用 OpenAI，获取 /v1/models 列表 */
    @Get("/openaiModelList")
    async openaiModelList(@Query("modelClassify") modelClassify: string) {
        return await this.modelService.listOpenAIModelsByClassify(modelClassify);
    }
}