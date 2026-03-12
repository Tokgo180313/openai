import { useModelStore } from "@/stores/modelStore";

const modelStore = useModelStore();
const roleList = modelStore.getRoleList;
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
    title: "操作时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
  },
];
export default { columns };
