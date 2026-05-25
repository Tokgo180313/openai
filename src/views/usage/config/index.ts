const columns = [
  {
    title: "用户账号",
    dataIndex: "account",
    key: "account",
    ellipsis: true,
  },
  {
    title: "模型类型",
    dataIndex: "modelName",
    key: "modelName",
    ellipsis: true,
  },
  {
    title: "服务商",
    dataIndex: "provider",
    key: "provider",
    ellipsis: true,
  },
  {
    title: "输入Tokens",
    dataIndex: "promptTokens",
    key: "promptTokens",
    ellipsis: true,
  },
  {
    title: "输出Tokens",
    dataIndex: "completionTokens",
    key: "completionTokens",
    ellipsis: true,
  },
  {
    title:"思考Tokens",
    dataIndex:"thoughtTokens",
    key:"thoughtTokens",
    ellipsis: true,
  },
  {
    title: "总Tokens",
    dataIndex: "totalTokens",
    key: "totalTokens",
    ellipsis: true,
  },
  {
    title: "描述",
    dataIndex: "description",
    key: "description",
    ellipsis: true,
  },
  {
    title:"状态",
    dataIndex:"status",
    key:"status",
    width: 80,
    customRender: ({ record }: { record: { status?: string } }) => {
      if(record.status === "success" || record.status === "0"){
        return "成功";
      }
      if(record.status === "failed" || record.status === "1"){
        return "失败";
      }
      return "处理中";
    },
    ellipsis: true,
  },
  {
    title: "操作时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
    ellipsis: true,
  },
];
export default { columns };
