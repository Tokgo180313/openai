import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { ChoiceEntity } from "./entity/ChoiceEntity";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class ChatService {
    constructor(private configService:ConfigService){}

    public async completionFunction(messageDto){
        console.log()
        const openai = new OpenAI({
            baseURL:"https://api.deepseek.com",
            apiKey:this.configService.get("VUE_APP_API_KEY"),
        })
        
        let  response = await openai.chat.completions.create({
            messages:messageDto,
            model:"deepseek-chat"
        })
        if(response){
            return response
        }else{
            return null
        }
    }

}