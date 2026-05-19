import type { MenuRow, MenuTreeNode } from "../types";

export function listToMenuTree(list: MenuRow[]): MenuTreeNode[] {
  const map = new Map<number, MenuTreeNode>();

  for (const item of list) {
    map.set(item.id, { ...item, children: [] });
  }

  const roots: MenuTreeNode[] = [];

  for (const node of map.values()) {
    if (node.parentId == null || !map.has(node.parentId)) {
      roots.push(node);
    } else {
      map.get(node.parentId)!.children!.push(node);
    }
  }

  const sortNodes = (nodes: MenuTreeNode[]) => {
    nodes.sort((a, b) => a.sort - b.sort);
    for (const node of nodes) {
      if (node.children?.length) {
        sortNodes(node.children);
      } else {
        delete node.children;
      }
    }
  };

  sortNodes(roots);
  return roots;
}

export function hasNestedChildren(list: MenuRow[]): boolean {
  return list.some(
    (item) => Array.isArray(item.children) && item.children.length > 0,
  );
}
