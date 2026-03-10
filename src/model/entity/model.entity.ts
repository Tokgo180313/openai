export class ModelEntity {
    id:string;
    modelName:string;
    modelClassify:string;
    description:string;
    createdAt:Date;
    updatedAt:Date;

    constructor(partial:Partial<ModelEntity>){
        Object.assign(this,partial);
    }

    toJSON(){
        const ret = {...this};
        if(ret.createdAt){
            ret.createdAt = ret.createdAt.toISOString();
        }
        if(ret.updatedAt){
            ret.updatedAt = ret.updatedAt.toISOString();
        }
        return ret;
    }
}