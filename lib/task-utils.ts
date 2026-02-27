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
 * Builds a subtask tree without project grouping.
 * Result: Task → Subtask → Sub-subtask → …
 */
export function buildSubtaskTree(tasks: ClickUpTask[]): ClickUpTask[] {
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

/**
 * Groups a flat list of tasks into an arbitrarily-deep tree,
 * then wraps roots in project-level group rows.
 *
 * Result: Project group → Task → Subtask → Sub-subtask → …
 */
export function buildProjectTree(tasks: ClickUpTask[]): ClickUpTask[] {
  const roots = buildSubtaskTree(tasks);

  const projectGroups = new Map<string, ClickUpTask[]>();
  for (const root of roots) {
    const projectKey = root.project?.id ?? "_none";
    if (!projectGroups.has(projectKey)) {
      projectGroups.set(projectKey, []);
    }
    projectGroups.get(projectKey)!.push(root);
  }

  const result: ClickUpTask[] = [];
  for (const [projectKey, children] of projectGroups) {
    const sample = children[0];
    const projectGroup: ClickUpTask = {
      ...sample,
      id: `project-${projectKey}`,
      name: sample.project?.name || "No project",
      parent: null,
      parent_name: null,
      _isProjectGroup: true,
      _isVirtualParent: false,
      subTasks: children,
      url: sample.folder?.id && sample.space?.id
        ? `https://app.clickup.com/${sample.team_id}/v/f/${sample.folder.id}/${sample.space.id}`
        : "",
    };
    result.push(projectGroup);
  }

  function mostRecentActivity(group: ClickUpTask): number {
    let latest = 0;
    for (const task of group.subTasks ?? []) {
      const updated = parseInt(task.date_updated || "0") || 0;
      const created = parseInt(task.date_created || "0") || 0;
      latest = Math.max(latest, updated, created);
    }
    return latest;
  }

  result.sort((a, b) => mostRecentActivity(b) - mostRecentActivity(a));

  return result;
}
