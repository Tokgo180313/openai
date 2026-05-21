const columns = [
  { title: "服务商", dataIndex: "provider", key: "provider", ellipsis: true },
  { title: "模型编码", dataIndex: "modelCode", key: "modelCode", ellipsis: true },
  {
    title: "API 模型名",
    dataIndex: "apiModelName",
    key: "apiModelName",
    ellipsis: true,
  },
  { title: "模型类型", dataIndex: "modelType", key: "modelType", width: 90 },
  { title: "Base URL", dataIndex: "baseUrl", key: "baseUrl", ellipsis: true },
  { title: "排序", dataIndex: "sort", key: "sort", width: 70 },
  { title: "状态", dataIndex: "enabled", key: "enabled", width: 80 },
  { title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 170 },
  { title: "操作", key: "action", width: 180 },
];

export default { columns };
