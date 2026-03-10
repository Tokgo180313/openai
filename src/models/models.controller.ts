import { Body, Controller, Delete, Get, Post, Put, Query } from "@nestjs/common";
import { ModelService } from "./models.service";
import { ModelsDto } from "./dto/models.dto";
import { ApiTags } from "@nestjs/swagger";
import { ModelsEntity } from "./entity/models.entity";

@ApiTags("model")
@Controller("/model")
export class ModelController {
    constructor(private readonly modelService: ModelService){}

    @Put("/add")
    async addModel(@Body() modelDto:ModelsEntity){
        return await this.modelService.createModel(modelDto)
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
    @Get("/findClassifyList")
    async findClassifyList(){
        return await this.modelService.findClassifyList()
    }
    
}