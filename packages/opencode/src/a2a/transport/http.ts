import { Hono } from "hono"
import { Transport } from "./transport"

export class HttpTransport implements Transport {
  private app: Hono
  private port: number
  private server: any
  private handler: ((message: any) => Promise<any>) | undefined

  constructor(port: number) {
    this.port = port
    this.app = new Hono()
    this.setupRoutes()
  }

  private setupRoutes() {
    this.app.get("/.well-known/a2a.json", (c) => {
      // Discovery endpoint usually handled by the transport or delegated
      // We will delegate this to the main server logic eventually,
      // but for now keeping it simple or letting the handler decide.
      // Actually, transport should just pipe requests.
      // But .well-known is specific to HTTP discovery.
      return c.json({
        a2a_version: "0.3.0",
        preferred_transport: "http",
        transports: ["http"],
      })
    })

    this.app.post("/a2a", async (c) => {
      if (!this.handler) {
        return c.json({ error: "No handler registered" }, 500)
      }
      const body = await c.req.json()
      const response = await this.handler(body)
      return c.json(response)
    })
  }

  onMessage(handler: (message: any) => Promise<any>) {
    this.handler = handler
  }

  async start() {
    this.server = Bun.serve({
      port: this.port,
      fetch: this.app.fetch,
    })
  }

  async stop() {
    if (this.server) {
      this.server.stop()
    }
  }

  // Helper for testing
  fetch(req: Request) {
    return this.app.fetch(req)
  }
}
