export class UsageDto {
    page: number;
    pageSize: number;
    account?: string;
    modelName?: string;
    modelClassify?: string;
    startTime?: Date;
    endTime?: Date;
    get skip():number{
        return (this.page-1)*this.pageSize
    }
    get limit():number{
        return this.pageSize
    }
}