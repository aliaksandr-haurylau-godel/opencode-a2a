import { Hono } from "hono"
import { Protocol } from "../protocol/protocol"

export class A2AServer {
  private app: Hono
  private port: number

  constructor(options: { port: number }) {
    this.port = options.port
    this.app = new Hono()
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
      // JSON-RPC handler placeholder
      return c.json({ jsonrpc: "2.0", id: null, result: "ok" })
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
