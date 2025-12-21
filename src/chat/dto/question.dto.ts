import { IsString } from "class-validator";

export class QuestionDto{
    @IsString()
    role:string;
    @IsString()
    content:string;
    @IsString()
    useModel:string;
}