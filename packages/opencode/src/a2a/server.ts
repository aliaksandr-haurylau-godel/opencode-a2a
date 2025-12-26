import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { DefaultRequestHandler, JsonRpcTransportHandler } from "@a2a-js/sdk/server"
import { OpencodeClient } from "@opencode-ai/sdk"
import { createAgentCard } from "./card"
import { OpenCodeTaskStore } from "./store"
import { OpenCodeExecutor } from "./executor"
import { Log } from "../util/log"

const log = Log.create({ service: "a2a-server" })

export namespace A2AServer {
  export async function listen(opts: { port: number; hostname: string; sdk: OpencodeClient }) {
    const baseUrl = `http://${opts.hostname}:${opts.port}`

    // Initialize components
    const card = await createAgentCard(baseUrl)
    const taskStore = new OpenCodeTaskStore()
    const executor = new OpenCodeExecutor(taskStore, opts.sdk)

    // Create Request Handler
    const requestHandler = new DefaultRequestHandler(
      card,
      taskStore,
      executor
    )

    // Create Transport Handler
    const transportHandler = new JsonRpcTransportHandler(requestHandler)

    // Setup Hono server for A2A
    const app = new Hono()

    app.onError((err, c) => {
      log.error("request error", { error: err })
      return c.json({ error: { message: err.message } }, 500)
    })

    app.get("/.well-known/agent-card.json", async (c) => {
      const agentCard = await requestHandler.getAgentCard()
      return c.json(agentCard)
    })

    app.post("/", async (c) => {
      try {
        // Hono body parsing
        let body
        try {
            body = await c.req.json()
        } catch (e) {
            log.error("invalid json body", { error: e })
            return c.json({ error: { code: -32700, message: "Parse error" } }, 400)
        }

        // Handle the request
        const response = await transportHandler.handle(body)

        // If response is a generator, we need to stream it
        if (response && typeof response === "object" && Symbol.asyncIterator in response) {
            // Headers are set by streamSSE, but we can set them explicitly if needed
            // streamSSE sets Content-Type: text/event-stream
            return streamSSE(c, async (stream) => {
                // @ts-ignore - TS doesn't like AsyncGenerator in for-await here easily without full types
                for await (const chunk of response) {
                    await stream.writeSSE({
                        data: JSON.stringify(chunk)
                    })
                }
            })
        } else if (response) {
            return c.json(response)
        } else {
            // Notification - no response
            return c.body(null, 204)
        }
      } catch (err) {
          log.error("handler error", { error: err })
          // If we are here, we haven't started streaming yet
          return c.json({ error: { code: -32603, message: "Internal error" } }, 500)
      }
    })

    app.get("/health", (c) => c.json({ status: "ok" }))

    // Start server
    const server = Bun.serve({
      port: opts.port,
      hostname: opts.hostname,
      fetch: app.fetch,
    })

    log.info("started", { url: baseUrl })

    return server
  }
}
