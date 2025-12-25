import { Hono } from "hono"
import { stream } from "hono/streaming"
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

    app.post("/", async (c) => {
      // Hono body parsing
      const body = await c.req.json()

      // Handle the request
      const response = await transportHandler.handle(body)

      // If response is a generator, we need to stream it
      if (Symbol.asyncIterator in response) {
        c.header("Content-Type", "application/x-ndjson")
        return stream(c, async (stream) => {
            // @ts-ignore - TS doesn't like AsyncGenerator in for-await here easily without full types
            for await (const chunk of response) {
                await stream.write(JSON.stringify(chunk) + "\n")
            }
        })
      } else {
        return c.json(response)
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
