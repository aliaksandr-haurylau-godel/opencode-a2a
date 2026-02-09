import { Protocol } from "../../protocol/protocol"
import { AgentService } from "../services/agent"
import { SessionService } from "../services/session"

export class TaskHandler {
  private agentService: AgentService
  private sessionService: SessionService

  constructor(agentService: AgentService, sessionService: SessionService) {
    this.agentService = agentService
    this.sessionService = sessionService
  }

  async handleRunTask(params: any) {
    const validated = Protocol.RunTaskRequest.parse(params)
    const sessionId = await this.sessionService.create(validated.task)
    return {
      taskId: sessionId,
      status: "pending",
    }
  }

  async handlePostMessage(params: any) {
    const validated = Protocol.PostMessageRequest.parse(params)
    const result = await this.sessionService.postMessage(validated.taskId, validated.content)
    return {
      success: true,
      messageId: result,
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
    // Check if it's an agent definition (task capability) or a running session (task execution)
    const agent = await this.agentService.get(params.id)
    if (agent) {
      return {
        id: params.id,
        status: "pending", // Agent definition is "pending" execution? Or "ready"? Spec is vague here for capabilities.
        result: null,
      }
    }

    try {
      const session = await this.sessionService.get(params.id)
      return {
        id: session.id,
        status: session.status,
        result: null,
      }
    } catch {
      throw new Error(`Task not found: ${params.id}`)
    }
  }
}
