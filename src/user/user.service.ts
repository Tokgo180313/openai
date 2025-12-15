import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "src/schemas/user/user.schema";
import { UserDto } from "./dto/UserDto";
import { UserEntity } from "./entity/UserEntity";
import { PasswordUtil } from "src/common/utils/password.utils";
@Injectable()
export class UserService{
    constructor(@InjectModel(User.name) private userSchema:Model<UserDocument>){}

    //添加
    async create(userDto:UserDto):Promise<User>{
        const existingUser = await this.userSchema.findOne({$or:[{account:userDto.account}]});
        if(existingUser){
            if(existingUser.account === userDto.account){
                throw new ConflictException("账号已存在");
            }
        }
        console.log(userDto)
        userDto.password = process.env.INITIAL_PASSWORD || "123456!"
        const createUser = new this.userSchema(userDto)
        return await createUser.save();
    }
    //查询
    async findAll():Promise<User[]>{
        return await this.userSchema.find().exec()
    }

    //查找
    async findOne(userDto:UserDto):Promise<User|null>{
        return await this.userSchema.findOne(userDto)
    }
    // 根据账号查询用户，包含密码，用于验证
    async findUserByAccountWithPassword(account:string):Promise<UserDocument|null>{
        return this.userSchema.findOne({account}).select("+password").exec();
    }
    // 根据ID查找用户
    async findById(id:string):Promise<User|null>{
        return await this.userSchema.findById(id).exec();
    }
    //删除
    async deleteById(id:string):Promise<void>{
        const deleteUser =  await this.userSchema.findByIdAndDelete(id).exec();
        console.log("id",id)
        if(!deleteUser){
            throw new NotFoundException("用户不存在");
        }
    }

    async updatePassword(id:string,newPassword:string):Promise<void>{
        const hashPassword = await PasswordUtil.hash(newPassword);
        const result = await this.userSchema.findByIdAndUpdate(id,
            {password:hashPassword,passwordType:"1"},
            {
                new:true,
            }
        ).exec();
        if(!result){
            throw new NotFoundException("用户不存在");
        }
    }
    async updateUser(userDto:UserDto):Promise<User>{
        if(userDto.password){
            userDto.password = await PasswordUtil.hash(userDto.password);
            userDto.passwordType="1"
        }
        const updateUser = await this.userSchema.findByIdAndUpdate(userDto.id,userDto,{new:true}).exec();
        if(!updateUser){
            throw new NotFoundException("用户不存在");
        }
        return updateUser;
    }
    async resetUser(userDto:UserDto):Promise<User>{
        userDto.password = process.env.INITIAL_PASSWORD || "123456!"
        userDto.passwordType = "";
        const updateUser = await this.userSchema.findByIdAndUpdate(userDto.id,userDto,{new:true}).exec();
        if(!updateUser){
            throw new NotFoundException("重置失败")
        }
        return updateUser;
    }
    // 验证用户
    async validateUser(account:string,password:string):Promise<User|null>{
        let user:UserDocument | null = null;
        user = await this.findUserByAccountWithPassword(account);
        if(user && await user.validaterPassword(password)){
            return user;
        }
        return null;
    }
}