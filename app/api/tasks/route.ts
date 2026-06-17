import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ClickUpTasksResponse } from "@/types/clickup";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiToken = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;

  if (!apiToken || !teamId) {
    return NextResponse.json(
      { error: 'Missing ClickUp API credentials. Please set CLICKUP_API_TOKEN and CLICKUP_TEAM_ID in your .env.local file.' },
      { status: 500 }
    );
  }

  try {
    // First, get the current user's ID
    const userResponse = await fetch('https://api.clickup.com/api/v2/user', {
      headers: {
        'Authorization': apiToken,
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    const userId = userData.user.id;
    const userName = userData.user.username || "";

    // Fetch all tasks assigned to the current user, paginating through results
    const allTasks: ClickUpTasksResponse['tasks'] = [];
    let page = 0;
    while (true) {
      const tasksResponse = await fetch(
        `https://api.clickup.com/api/v2/team/${teamId}/task?assignees[]=${userId}&include_closed=false&subtasks=true&page=${page}`,
        { headers: { 'Authorization': apiToken } }
      );

      if (!tasksResponse.ok) {
        const errorText = await tasksResponse.text();
        throw new Error(`Failed to fetch tasks: ${tasksResponse.statusText} - ${errorText}`);
      }

      const data: ClickUpTasksResponse = await tasksResponse.json();
      allTasks.push(...data.tasks);
      if (data.tasks.length < 100) break;
      page++;
    }

    const data = { tasks: allTasks };

    // Build map of task id -> name for parent labels (from tasks in this response)
    const idToName = new Map<string, string>(data.tasks.map((t) => [t.id, t.name]));

    // Find parent IDs we're missing (parent not in response because not assigned to user)
    const assignedTasksRaw = data.tasks.filter((task) =>
      task.assignees.some((assignee) => assignee.id === userId)
    );
    const missingParentIds = [...new Set(
      assignedTasksRaw
        .filter((t) => t.parent && !idToName.has(t.parent))
        .map((t) => t.parent as string)
    )];

    // Fetch missing parent task names from ClickUp API
    const authHeader = { Authorization: apiToken };
    await Promise.all(
      missingParentIds.map(async (parentId) => {
        try {
          const res = await fetch(`https://api.clickup.com/api/v2/task/${parentId}`, {
            headers: authHeader,
          });
          if (!res.ok) return;
          const parentTask = await res.json();
          if (parentTask.name) idToName.set(parentId, parentTask.name);
        } catch {
          // ignore single fetch failure
        }
      })
    );

    const assignedTasks = assignedTasksRaw.map((task) => ({
      ...task,
      parent_name: task.parent ? idToName.get(task.parent) ?? null : null,
    }));

    return NextResponse.json({ tasks: assignedTasks, userName });
  } catch (error) {
    console.error('Error fetching ClickUp tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
