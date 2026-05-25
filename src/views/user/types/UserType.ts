export interface UserType {
    id:string,
    account:string,
    password:string,
    roleId:string,
    updateTime:Date,
}

export interface columnType {
  title?: string;
  name?: string;
  dataIndex?: string;
  key?: string;
}

export interface searchFormType{
    name:string,
}