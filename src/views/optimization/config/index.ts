const typeOptions = [{ label: "图片编辑", value: "image_edit" }];

const statusOptions = [
  { label: "启用", value: "1" },
  { label: "停用", value: "0" },
];

const columns = [
  { title: "ID", dataIndex: "id", key: "id", width: 80 },
  { title: "类型", dataIndex: "type", key: "type", width: 120, ellipsis: true },
  { title: "文案内容", dataIndex: "content", key: "content", ellipsis: true },
  { title: "状态", dataIndex: "status", key: "status", width: 88 },
  { title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 168 },
];

export default {
  typeOptions,
  statusOptions,
  columns,
};
