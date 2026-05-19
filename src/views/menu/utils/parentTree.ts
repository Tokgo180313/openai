import type { MenuRow, MenuTreeNode, ParentTreeOption } from "../types";
import { listToMenuTree } from "./tree";

function mapTreeNodes(
  nodes: MenuTreeNode[],
  excludeId?: number,
): ParentTreeOption[] {
  return nodes
    .filter((node) => node.id !== excludeId)
    .map((node) => ({
      value: node.id,
      title: `${node.name}（${node.code}）`,
      children: node.children?.length
        ? mapTreeNodes(node.children, excludeId)
        : undefined,
    }));
}

export function buildParentTreeOptions(
  list: MenuRow[],
  excludeId?: number,
): ParentTreeOption[] {
  if (!list.length) {
    return [];
  }
  return mapTreeNodes(listToMenuTree(list), excludeId);
}
