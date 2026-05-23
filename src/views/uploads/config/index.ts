const columns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 80,
  },
  {
    title: "文件名",
    dataIndex: "originalName",
    key: "originalName",
    ellipsis: true,
  },
  {
    title: "类型",
    dataIndex: "fileType",
    key: "fileType",
    width: 90,
  },
  {
    title: "MIME",
    dataIndex: "mimeType",
    key: "mimeType",
    ellipsis: true,
    width: 160,
  },
  {
    title: "大小",
    dataIndex: "size",
    key: "size",
    width: 100,
  },
  {
    title: "来源",
    dataIndex: "source",
    key: "source",
    width: 110,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 90,
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 170,
  },
  {
    title: "操作",
    key: "action",
    width: 260,
    fixed: "right" as const,
  },
];

export default { columns };
