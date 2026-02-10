import { cmd } from "./cmd"
import { Log } from "@/util/log"
import { A2AServer } from "../../a2a/server/server"
import { HttpTransport } from "../../a2a/transport/http-transport"
import { TaskHandler } from "../../a2a/server/handlers/task-handler"
import { DefaultAgentService } from "../../a2a/server/services/agent"
import { DefaultSessionService } from "../../a2a/server/services/session-service"
import { createOpencodeClient } from "@opencode-ai/sdk/v2"
import { Server } from "../../server/server"

const log = Log.create({ service: "a2a-command" })

export const A2aCommand = cmd({
  command: "a2a",
  describe: "start A2A (Agent-to-Agent) protocol server",
  builder: (yargs) => {
    return yargs.option("port", {
      describe: "server port",
      type: "number",
      default: 3000,
    })
  },
  handler: async (args) => {
    log.info("Starting A2A server", { port: args.port })

    const transport = new HttpTransport(args.port)
    const agentService = new DefaultAgentService()

    // Initialize SDK client for session service
    // We assume the server is running on the same host but different port for A2A?
    // Actually, A2A server IS the server extension.
    // We need to connect to the MAIN OpenCode server API.
    // Assuming standard port 4096 or similar.
    // For now, we use localhost:4096 as default if running locally.
    const mainServerUrl = `http://localhost:4096`
    const sdk = createOpencodeClient({
        baseUrl: mainServerUrl,
    })

    const sessionService = new DefaultSessionService(sdk)
    const taskHandler = new TaskHandler(agentService, sessionService)
    const server = new A2AServer(transport, taskHandler)

    await server.start()

    // Output for inspector discovery
    console.log(`A2A Server listening on port ${args.port}`)
    log.info("A2A server started", { port: args.port })

    // Keep process alive
    await new Promise(() => {})
  },
})
