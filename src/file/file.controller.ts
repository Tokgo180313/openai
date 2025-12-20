import { Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FileService } from "./file.service";

@ApiTags("file")
@Controller("/file")
export class FileController{
    constructor(private fileService:FileService){}

    @Post("/upload")
    async uploadFile(){
        console.log("upload file")

        return Promise.resolve()
    }
}