import { Body, Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LoginDto } from "./dto/LoginDto";

@ApiTags("login")
@Controller("/login")
export class LoginController {
    
    public loginInfo(@Body() loginDto:LoginDto ){
        
    }
}