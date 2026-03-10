import { Expose, Transform } from "class-transformer";

export class ModelsEntity {
    id:string;
    modelName:string;
    modelClassify:string;
    description:string;
    createdAt:Date;
    updatedAt:Date;

    constructor(partial:Partial<ModelsEntity>){
        Object.assign(this,partial);
    }
}