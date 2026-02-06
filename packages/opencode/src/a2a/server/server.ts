import { Transport } from "../transport/transport"
import { TaskHandler } from "./handlers/task"
import { JsonRpc } from "../protocol/jsonrpc"

// A2AServer: Decoupled server implementation using injected Transport
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
      return JsonRpc.error(null, JsonRpc.Errors.InvalidRequest, "Invalid Request")
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
          return JsonRpc.error(body.id, JsonRpc.Errors.MethodNotFound, "Method not found")
      }
      return JsonRpc.success(body.id, result)
    } catch (e: any) {
      return JsonRpc.error(body.id, JsonRpc.Errors.InternalError, e.message)
    }
  }
}
