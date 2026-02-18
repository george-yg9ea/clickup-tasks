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

    // Fetch tasks assigned to the current user
    const tasksResponse = await fetch(
      `https://api.clickup.com/api/v2/team/${teamId}/task?assignees[]=${userId}&include_closed=false`,
      {
        headers: {
          'Authorization': apiToken,
        },
      }
    );

    if (!tasksResponse.ok) {
      const errorText = await tasksResponse.text();
      throw new Error(`Failed to fetch tasks: ${tasksResponse.statusText} - ${errorText}`);
    }

    const data: ClickUpTasksResponse = await tasksResponse.json();

    // Filter tasks to only include those assigned to the current user
    const assignedTasks = data.tasks.filter(task => 
      task.assignees.some(assignee => assignee.id === userId)
    );

    return NextResponse.json({ tasks: assignedTasks });
  } catch (error) {
    console.error('Error fetching ClickUp tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
