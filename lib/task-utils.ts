import { ClickUpTask } from "@/types/clickup";

export function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  return new Date(parseInt(dateString)).toLocaleDateString();
}

export function getStatusColor(statusType: string): "default" | "secondary" | "outline" {
  switch (statusType) {
    case "open":
      return "default";
    case "closed":
      return "secondary";
    default:
      return "outline";
  }
}

/**
 * Groups a flat list of tasks into an arbitrarily-deep tree.
 * Handles task → subtask → sub-subtask → … at any depth.
 * When a parent is not in the list, a virtual row is created from parent_name.
 */
export function buildTaskTree(tasks: ClickUpTask[]): ClickUpTask[] {
  const nodeMap = new Map<string, ClickUpTask>();

  for (const task of tasks) {
    nodeMap.set(task.id, { ...task, subTasks: [] });
  }

  const roots: ClickUpTask[] = [];
  const orphansByParent = new Map<string, ClickUpTask[]>();

  for (const node of nodeMap.values()) {
    if (!node.parent) {
      roots.push(node);
    } else if (nodeMap.has(node.parent)) {
      nodeMap.get(node.parent)!.subTasks!.push(node);
    } else {
      if (!orphansByParent.has(node.parent)) {
        orphansByParent.set(node.parent, []);
      }
      orphansByParent.get(node.parent)!.push(node);
    }
  }

  for (const [parentId, children] of orphansByParent) {
    const firstChild = children[0];
    const virtualParent: ClickUpTask = {
      ...firstChild,
      id: `virtual-${parentId}`,
      name: firstChild.parent_name || "Parent task",
      parent: null,
      parent_name: null,
      _isVirtualParent: true,
      subTasks: children,
      url: "",
    };
    roots.push(virtualParent);
  }

  return roots;
}
