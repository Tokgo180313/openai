import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtAccessPayload } from "./interfaces/jwt-payload.interface";

/** JWT 校验后的 request.user（与 TypeORM users.id 对应） */
export interface JwtValidatedUser {
    account: string;
    id: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(private readonly config: ConfigService){
        super({
            jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration:false,
            secretOrKey: config.get<string>('JWT_SECRET') || 'my-secret-key',
        })
    }
    async validate(payload: JwtAccessPayload): Promise<JwtValidatedUser>  {
        return {
            account: payload.account,
            id: String(payload.sub),
        };
    }
}