import type { AgentExecutor, ExecutionEventBus, RequestContext } from "@a2a-js/sdk/server"
import type { OpenCodeTaskStore } from "./store"
import { OpencodeClient } from "@opencode-ai/sdk"
import { Log } from "../util/log"

const log = Log.create({ service: "a2a-executor" })

export class OpenCodeExecutor implements AgentExecutor {
  constructor(
    private taskStore: OpenCodeTaskStore,
    private sdk: OpencodeClient,
  ) {}

  execute = async (requestContext: RequestContext, eventBus: ExecutionEventBus) => {
    const taskId = requestContext.taskId
    const message = requestContext.userMessage

    log.info("execute", { taskId, messageId: message.messageId })

    // 1. Get or create session
    let sessionId = this.taskStore.getSessionId(taskId)
    let isNewSession = false

    if (!sessionId) {
      // Create new session
      const session = await this.sdk.session
        .create({
          body: {
            title: `A2A Task ${taskId.slice(0, 8)}`,
          },
          throwOnError: true,
        })
        .then((x) => x.data)
      sessionId = session.id
      this.taskStore.setSessionId(taskId, sessionId)
      isNewSession = true
    }

    // Update status to working
    eventBus.publish({
      kind: "status-update",
      taskId,
      contextId: requestContext.contextId,
      final: false,
      status: {
        state: "working",
        timestamp: new Date().toISOString(),
      },
    })

    // 2. Extract text prompt
    const textPart = message.parts.find((p) => p.kind === "text")
    if (!textPart || textPart.kind !== "text") {
      log.error("no text part in message")
      return
    }
    const promptText = textPart.text

    // 3. Prompt the session
    // Subscribe to events first
    const abortController = new AbortController()

    // We await subscription setup to avoid race condition
    // We also pass a promise resolve function to be called when "done" event is seen
    // to ensure we captured everything.
    let eventStreamDoneResolve: () => void
    const eventStreamDone = new Promise<void>((resolve) => {
      eventStreamDoneResolve = resolve
    })

    await this.startEventListener(
      sessionId,
      eventBus,
      taskId,
      requestContext.contextId,
      abortController.signal,
      // @ts-ignore
      eventStreamDoneResolve,
    )

    try {
      // Send prompt
      await this.sdk.session.prompt({
        path: { id: sessionId },
        body: {
          parts: [{ type: "text", text: promptText }],
        },
      })

      // Prompt has returned, meaning generation is finished on server side.
      // We give a small buffer for events to arrive, or wait for event listener to see "finish"?
      // The event listener doesn't explicitly detect "finish" currently.
      // So we'll just wait a short moment to ensure the event stream buffer is drained.
      await new Promise((resolve) => setTimeout(resolve, 500))

      // If prompt returns successfully, we mark as completed
      eventBus.publish({
        kind: "status-update",
        taskId,
        contextId: requestContext.contextId,
        final: true,
        status: {
          state: "completed",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (err) {
      log.error("failed to prompt session", { error: err })
      eventBus.publish({
        kind: "status-update",
        taskId,
        contextId: requestContext.contextId,
        final: true,
        status: {
          state: "failed",
          timestamp: new Date().toISOString(),
          message: {
            kind: "message",
            messageId: crypto.randomUUID(),
            role: "agent",
            parts: [{ kind: "text", text: String(err) }],
          },
        },
      })
    } finally {
      // Stop the event listener
      abortController.abort()
    }
  }

  cancelTask = async (taskId: string, eventBus: ExecutionEventBus) => {
    const sessionId = this.taskStore.getSessionId(taskId)
    if (sessionId) {
      await this.sdk.session.abort({
        path: { id: sessionId },
      })
    }
    eventBus.publish({
      kind: "status-update",
      taskId,
      contextId: "", // We might not have it easily here without storing it
      final: true,
      status: {
        state: "canceled",
        timestamp: new Date().toISOString(),
      },
    })
  }

  private async startEventListener(
    sessionId: string,
    eventBus: ExecutionEventBus,
    taskId: string,
    contextId: string,
    signal: AbortSignal,
    doneCallback?: () => void,
  ) {
    // Perform subscription and wait for it
    const events = await this.sdk.event.subscribe({
      query: { directory: process.cwd() },
    })

    const iterator = events.stream

    // Start background loop
    ;(async () => {
      try {
        for await (const event of iterator) {
          if (signal.aborted) break

          if (event.type === "message.part.updated") {
            const props = event.properties
            const { part } = props

            if (part.sessionID !== sessionId) continue

            // Fetch message to check role, as per ACP agent
            const message = await this.sdk.session
              .message({
                path: {
                  id: sessionId,
                  messageID: part.messageID,
                },
              })
              .then((x) => x.data)
              .catch((err) => {
                log.error("unexpected error when fetching message", { error: err })
                return undefined
              })

            if (!message || message.info.role !== "assistant") continue

            if (part.type === "text") {
              const delta = props.delta
              if (delta) {
                eventBus.publish({
                  kind: "artifact-update",
                  taskId,
                  contextId,
                  append: true,
                  artifact: {
                    artifactId: "response",
                    name: "response",
                    parts: [{ kind: "text", text: delta }],
                  },
                })
              }
            } else if (part.type === "tool") {
              if (part.state.status === "running") {
                eventBus.publish({
                  kind: "status-update",
                  taskId,
                  contextId,
                  final: false,
                  status: {
                    state: "working",
                    timestamp: new Date().toISOString(),
                    message: {
                      kind: "message",
                      messageId: crypto.randomUUID(),
                      role: "agent",
                      parts: [{ kind: "text", text: `Running tool: ${part.tool}` }],
                    },
                  },
                })
              }
            }
          }
        }
      } catch (err) {
        if (!signal.aborted) {
          log.error("event listener error", { error: err })
        }
      } finally {
        if (doneCallback) doneCallback()
      }
    })()
  }
}
