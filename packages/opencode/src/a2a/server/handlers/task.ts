import { Protocol } from "../../protocol/protocol"

export class TaskHandler {
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
}
