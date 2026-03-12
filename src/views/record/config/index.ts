const columns = [
  {
    title: "用户昵称",
    dataIndex: "userName",
    key: "userName",
  },
  {
    title: "用户账号",
    dataIndex: "account",
    key: "account",
  },
  {
    title: "角色名称",
    dataIndex: "roleName",
    key: "roleName",
  },
  {
    title: "模型类型",
    dataIndex: "modelName",
    key: "modelName",
  },
  {
    title: "分类",
    dataIndex: "modelClassify",
    key: "modelClassify",
  },
  {
    title: "输入Tokens",
    dataIndex: "promptTokens",
    key: "promptTokens",
  },
  {
    title: "输出Tokens",
    dataIndex: "completionTokens",
    key: "completionTokens",
  },
  {
    title: "总Tokens",
    dataIndex: "totalTokens",
    key: "totalTokens",
  },
  {
    title: "操作时间",
    dataIndex: "createTime",
    key: "createTime",
  },
];
export default { columns };
