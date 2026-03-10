import { Body, Controller, Delete, Get, Post, Put, Query } from "@nestjs/common";
import { ModelService } from "./model.service";
import { ModelDto } from "./dto/ModelDto";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("model")
@Controller("/model")
export class ModelController {
    constructor(private readonly modelService: ModelService){}

    @Put("/add")
    async addModel(@Body() modelDto:ModelDto){
        return await this.modelService.createModel(modelDto)
    }

    @Post("/findModellist")
    async findModelList(@Body() modelDto:ModelDto){
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