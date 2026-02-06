import { Protocol } from "../../protocol/protocol"
import { AgentService } from "../services/agent"

export class TaskHandler {
  private agentService: AgentService

  constructor(agentService: AgentService) {
    this.agentService = agentService
  }

  async handleRunTask(params: any) {
    const validated = Protocol.RunTaskRequest.parse(params)
    // Placeholder logic: map to OpenCode session creation eventually
    return {
      taskId: `task_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
    }
  }

  async handlePostMessage(params: any) {
    const validated = Protocol.PostMessageRequest.parse(params)
    // Placeholder logic: map to OpenCode message
    return {
      success: true,
      messageId: `msg_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  async handleListTasks(params: any) {
    const agents = await this.agentService.list()
    return {
      tasks: agents.map((agent) => ({
        name: agent.name,
        description: agent.description ?? "",
        input_schema: {
          type: "object",
          properties: {
            prompt: { type: "string" },
          },
        },
      })),
    }
  }

  async handleGetTask(params: any) {
    const agent = await this.agentService.get(params.id)
    if (!agent) {
      throw new Error(`Task not found: ${params.id}`)
    }
    return {
      id: params.id,
      status: "pending",
      result: null,
    }
  }
}
