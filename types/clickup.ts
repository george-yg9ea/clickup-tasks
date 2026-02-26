// ClickUp API Types

export interface ClickUpUser {
  id: string;
  username: string;
  email: string;
  color: string;
  profilePicture: string;
  initials: string;
}

export interface ClickUpStatus {
  id: string;
  status: string;
  type: string;
  orderindex: number;
  color: string;
}

export interface ClickUpTask {
  id: string;
  name: string;
  status: ClickUpStatus;
  orderindex: string;
  date_created: string;
  date_updated: string;
  date_closed: string | null;
  archived: boolean;
  creator: ClickUpUser;
  assignees: ClickUpUser[];
  watchers: ClickUpUser[];
  checklists: any[];
  tags: any[];
  parent: string | null;
  /** Set by API when subtasks are included; parent task name for subtasks */
  parent_name?: string | null;
  /** Populated client-side: nested subtasks for expandable rows */
  subTasks?: ClickUpTask[];
  /** True when this is a virtual parent row (parent not assigned to user) */
  _isVirtualParent?: boolean;
  /** True when this row is a project group header */
  _isProjectGroup?: boolean;
  priority: {
    id: string;
    priority: string;
    color: string;
    orderindex: string;
  } | null;
  due_date: string | null;
  start_date: string | null;
  points: number | null;
  time_estimate: number | null;
  time_spent: number | null;
  custom_fields: any[];
  dependencies: any[];
  linked_tasks: any[];
  team_id: string;
  url: string;
  sharing: {
    public: boolean;
    public_share_expires_on: string | null;
    public_fields: string[];
    token: string | null;
    seo_optimized: boolean;
  };
  permission_level: string;
  list: {
    id: string;
    name: string;
    access: boolean;
  };
  project: {
    id: string;
    name: string;
    hidden: boolean;
    access: boolean;
  };
  folder: {
    id: string;
    name: string;
    hidden: boolean;
    access: boolean;
  };
  space: {
    id: string;
  };
}

export interface ClickUpTasksResponse {
  tasks: ClickUpTask[];
}
