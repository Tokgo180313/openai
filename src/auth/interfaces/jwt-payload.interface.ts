/** JWT 载荷（与 UserService / TypeORM User 主键配合） */
export interface JwtAccessPayload {
  account: string;
  /** 对应 users.id（UUID 字符串） */
  sub: string;
  exp?: number;
  nbf?: number;
  iss?: string;
}
