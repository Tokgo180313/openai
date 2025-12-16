export interface PaginationResponse<T>{
    list:T[];
    total:number;
    currentPage:number;
    totalPages:number;
}