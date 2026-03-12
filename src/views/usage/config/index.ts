const columns = [
  {
    title: "用户昵称",
    dataIndex: "nickName",
    key: "nickName",
  },
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
      if(record.status === "success" || record.status === "1"){
        return <a-tag color="green">成功</a-tag>;
      }
      if(record.status === "failed" || record.status === "0"){
        return <a-tag color="red">失败</a-tag>;
      }
      return <a-tag color="orange">处理中</a-tag>;
    },
  },
  {
    title: "操作时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
  },
];
export default { columns };
