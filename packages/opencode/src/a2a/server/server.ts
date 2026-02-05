import { Transport } from "../transport/http"
import { TaskHandler } from "./handlers/task"

export class A2AServer {
  private transport: Transport
  private taskHandler: TaskHandler

  constructor(transport: Transport, taskHandler: TaskHandler) {
    this.transport = transport
    this.taskHandler = taskHandler
    this.transport.onMessage(this.handleRequest.bind(this))
  }

  async start() {
    await this.transport.start()
  }

  async stop() {
    await this.transport.stop()
  }

  private async handleRequest(body: any): Promise<any> {
    if (body.jsonrpc !== "2.0") {
      return { jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request" }, id: null }
    }

    try {
      let result
      switch (body.method) {
        case "run_task":
          result = await this.taskHandler.handleRunTask(body.params)
          break
        case "post_message":
          result = await this.taskHandler.handlePostMessage(body.params)
          break
        case "tasks/list":
          result = await this.taskHandler.handleListTasks(body.params)
          break
        case "tasks/get":
          result = await this.taskHandler.handleGetTask(body.params)
          break
        case "ping":
          result = "ok"
          break
        default:
          return { jsonrpc: "2.0", error: { code: -32601, message: "Method not found" }, id: body.id }
      }
      return { jsonrpc: "2.0", result, id: body.id }
    } catch (e: any) {
      return { jsonrpc: "2.0", error: { code: -32000, message: e.message }, id: body.id }
    }
  }
}
