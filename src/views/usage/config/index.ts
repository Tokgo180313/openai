const columns = [
  {
    title: "用户账号",
    dataIndex: "account",
    key: "account",
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
    title:"思考Tokens",
    dataIndex:"thoughtTokens",
    key:"thoughtTokens",
  },
  {
    title: "总Tokens",
    dataIndex: "totalTokens",
    key: "totalTokens",
  },
  {
    title: "描述",
    dataIndex: "description",
    key: "description",
  },
  {
    title:"状态",
    dataIndex:"status",
    key:"status",
    customRender: ({ record }) => {
      if(record.status === "success" || record.status === "0"){
        return "成功";
      }
      if(record.status === "failed" || record.status === "1"){
        return "失败";
      }
      return "处理中";
    },
  },
  {
    title: "操作时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
  },
];
export default { columns };
