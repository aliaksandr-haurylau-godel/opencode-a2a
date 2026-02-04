import { Hono } from "hono"
import { Protocol } from "../protocol/protocol"
import { TaskHandler } from "./handlers/task"

export class A2AServer {
  private app: Hono
  private port: number
  private taskHandler: TaskHandler

  constructor(options: { port: number }) {
    this.port = options.port
    this.app = new Hono()
    this.taskHandler = new TaskHandler()
    this.setupRoutes()
  }

  private setupRoutes() {
    this.app.get("/.well-known/a2a.json", (c) => {
      return c.json({
        a2a_version: Protocol.Version,
        preferred_transport: "http",
        transports: ["http"],
      })
    })

    this.app.post("/a2a", async (c) => {
      const body = await c.req.json()
      // Basic JSON-RPC routing
      if (body.jsonrpc !== "2.0") {
        return c.json({ jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request" }, id: null })
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
          case "ping": // Keep ping for existing tests
            result = "ok"
            break
          default:
            return c.json({ jsonrpc: "2.0", error: { code: -32601, message: "Method not found" }, id: body.id })
        }
        return c.json({ jsonrpc: "2.0", result, id: body.id })
      } catch (e: any) {
        return c.json({ jsonrpc: "2.0", error: { code: -32000, message: e.message }, id: body.id })
      }
    })
  }

  async start() {
    return Bun.serve({
      port: this.port,
      fetch: this.app.fetch,
    })
  }

  fetch(req: Request) {
    return this.app.fetch(req)
  }
}
