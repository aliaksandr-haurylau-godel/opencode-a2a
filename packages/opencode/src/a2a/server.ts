import { Hono, type Context } from "hono"
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
    const requestHandler = new DefaultRequestHandler(card, taskStore, executor)

    // Create Transport Handler
    const transportHandler = new JsonRpcTransportHandler(requestHandler)

    // Setup Hono server for A2A
    const app = new Hono()

    const cleanResult = (obj: any) => {
      if (!obj || typeof obj !== "object") return obj
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { kind, ...rest } = obj
      return rest
    }

    const mapToStreamResponse = (rpcResponse: any) => {
      if (rpcResponse.error) {
        return {
          statusUpdate: {
            taskId: "unknown",
            status: {
              state: "failed",
              timestamp: new Date().toISOString(),
              message: {
                messageId: crypto.randomUUID(),
                role: "agent",
                parts: [{ kind: "text", text: rpcResponse.error.message || "Unknown error" }],
              },
            },
            final: true,
          },
        }
      }

      const result = rpcResponse.result
      if (!result) return null

      if (result.kind === "status-update") return { statusUpdate: cleanResult(result) }
      if (result.kind === "artifact-update") return { artifactUpdate: cleanResult(result) }
      if (result.kind === "task") return { task: cleanResult(result) }
      if (result.kind === "message") return { message: cleanResult(result) }

      // If we have a result but it doesn't match a known kind, just return it (fallback)
      return result
    }

    const handleA2ARequest = async (c: Context) => {
      const isStreamEndpoint = c.req.path === "/v1/message:stream"

      try {
        // Hono body parsing
        let body
        try {
          body = await c.req.json()
          log.info("request body", { body })

          // If this is the stream endpoint and the body is NOT a JSON-RPC request (missing jsonrpc field),
          // wrap it in a JSON-RPC envelope assuming it's the params for message/stream.
          if (isStreamEndpoint && !body.jsonrpc) {
            body = {
              jsonrpc: "2.0",
              method: "message/stream",
              params: body,
              id: "stream-request",
            }
            log.info("wrapped request body", { body })
          }
        } catch (e) {
          log.error("invalid json body", { error: e })
          const errorResponse = { error: { code: -32700, message: "Parse error" } }
          if (isStreamEndpoint) {
            return streamSSE(c, async (stream) => {
              const mapped = mapToStreamResponse(errorResponse)
              log.info("sending error (SSE)", { mapped })
              await stream.writeSSE({ data: JSON.stringify(mapped) })
            })
          }
          return c.json(errorResponse, 400)
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
              // chunk is the JSON-RPC response object from transport handler
              // we need to unwrap it if we are in stream endpoint
              let dataToSend = chunk
              if (isStreamEndpoint) {
                dataToSend = mapToStreamResponse(chunk)
              }

              if (dataToSend) {
                log.info("sending chunk", { data: dataToSend })
                await stream.writeSSE({
                  data: JSON.stringify(dataToSend),
                })
              }
            }
          })
        } else if (response) {
          if (isStreamEndpoint) {
            return streamSSE(c, async (stream) => {
              const mapped = mapToStreamResponse(response)
              log.info("sending response (SSE)", { mapped })
              await stream.writeSSE({ data: JSON.stringify(mapped) })
            })
          }
          return c.json(response)
        } else {
          // Notification - no response
          if (isStreamEndpoint) {
            return streamSSE(c, async (_stream) => {
              // No data
            })
          }
          return c.body(null, 204)
        }
      } catch (err) {
        log.error("handler error", { error: err })
        // If we are here, we haven't started streaming yet
        const errorResponse = { error: { code: -32603, message: "Internal error" } }
        if (isStreamEndpoint) {
          return streamSSE(c, async (stream) => {
            const mapped = mapToStreamResponse(errorResponse)
            log.info("sending handler error (SSE)", { mapped })
            await stream.writeSSE({ data: JSON.stringify(mapped) })
          })
        }
        return c.json(errorResponse, 500)
      }
    }

    app.onError((err, c) => {
      log.error("request error", { error: err })
      return c.json({ error: { message: err.message } }, 500)
    })

    app.get("/.well-known/agent-card.json", async (c) => {
      const agentCard = await requestHandler.getAgentCard()
      return c.json(agentCard)
    })

    app.post("/", handleA2ARequest)
    app.post("/v1/message:stream", handleA2ARequest)

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
