import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
export type UserDocument = User & Document
import { PasswordUtil } from "src/common/utils/password.utils";
@Schema({
    timestamps:true,
    toJSON:{
        transform:function(doc,ret){
            if("password" in ret){
                delete ret.password;
            }
            return ret;
        }
    }
})
export class User extends Document{

    @Prop({required:true,unique:true})
    account:string;

    @Prop({required:true})
    password:string;

    validaterPassword:(password:string)=>Promise<boolean>

}

export const UserSchema = SchemaFactory.createForClass(User);

// 添加实例方法
UserSchema.methods.validaterPassword = async function(password:string):Promise<boolean> {
    return PasswordUtil.compare(password,this.password)
}
// 前置中间件 - 保存钱加密密码
UserSchema.pre("save",async function(next) {
    const user = this as UserDocument;

    // 修改密码字段时加密
    if(!user.isModified("password")){
        return next();
    }

    try {
        user.password = await PasswordUtil.hash(user.password);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// 前置中间件 - findOneAndUpdate 时处理密码
UserSchema.pre("findOneAndUpdate",async function(next) {
    const update = this.getUpdate() as any;
    if(update.password){
        try {
            update.password = await PasswordUtil.hash(update.password);
            this.setUpdate(update)
        } catch (error) {
            next(error as Error)
        }
    }
    next();
})