import { IsArray, IsObject, IsString } from 'class-validator';
import OpenAI from 'openai';
import { QuestionDto } from './question.dto';
import { Type } from 'class-transformer';

export class MessageDto {
  @IsString()
  id: string;
  @IsObject()
  @Type(()=>QuestionDto)
  question:QuestionDto;
  @IsArray()
  list:OpenAI.ChatCompletionMessageParam[];
}
