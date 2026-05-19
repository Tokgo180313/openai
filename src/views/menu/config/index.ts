const columns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 80,
  },
  {
    title: "编码",
    dataIndex: "code",
    key: "code",
    ellipsis: true,
  },
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
  },
  {
    title: "路径",
    dataIndex: "path",
    key: "path",
    ellipsis: true,
  },
  {
    title: "图标",
    dataIndex: "icon",
    key: "icon",
    width: 120,
    ellipsis: true,
  },
  {
    title: "类型",
    dataIndex: "type",
    key: "type",
    width: 90,
  },
  {
    title: "排序",
    dataIndex: "sort",
    key: "sort",
    width: 80,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 90,
  },
  {
    title: "更新时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
    width: 180,
  },
  {
    title: "操作",
    key: "action",
    width: 200,
    fixed: "right",
  },
];

export default {
  columns,
};
