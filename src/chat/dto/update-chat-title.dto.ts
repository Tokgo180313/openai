import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateChatTitleDto {
  @IsString()
  @IsNotEmpty()
  titleId: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}
