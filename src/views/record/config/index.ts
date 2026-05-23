import { useModelStore } from "@/stores/modelStore";

const modelStore = useModelStore();
const roleList = modelStore.roleOptions;
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
    title: "描述",
    dataIndex: "description",
    key: "description",
  },

  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
  },
];
export default { columns };
