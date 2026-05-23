const columns = [
  { title: "参数路径", dataIndex: "paramPath", key: "paramPath", ellipsis: true },
  { title: "API 路径", dataIndex: "apiParamPath", key: "apiParamPath", ellipsis: true },
  { title: "模型", dataIndex: "modelLabel", key: "modelLabel", width: 140, ellipsis: true },
  { title: "段名", dataIndex: "paramKey", key: "paramKey", width: 100, ellipsis: true },
  { title: "类型", dataIndex: "paramType", key: "paramType", width: 88 },
  { title: "元素类型", dataIndex: "itemParamType", key: "itemParamType", width: 88 },
  { title: "必填", dataIndex: "required", key: "required", width: 56 },
  { title: "排序", dataIndex: "sort", key: "sort", width: 56 },
  { title: "默认值", dataIndex: "defaultValue", key: "defaultValue", ellipsis: true },
  { title: "状态", dataIndex: "enabled", key: "enabled", width: 72 },
  { title: "备注", dataIndex: "remark", key: "remark", ellipsis: true },
  { title: "操作", key: "action", width: 240, fixed: "right" as const },
];

export default { columns };
