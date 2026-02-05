import { cmd } from "./cmd"
import { Log } from "@/util/log"
import { A2AServer } from "../../a2a/server/server"
import { HttpTransport } from "../../a2a/transport/http"
import { TaskHandler } from "../../a2a/server/handlers/task"
import { DefaultAgentService } from "../../a2a/server/services/agent"

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
    const taskHandler = new TaskHandler(agentService)
    const server = new A2AServer(transport, taskHandler)

    await server.start()

    // Output for inspector discovery
    console.log(`A2A Server listening on port ${args.port}`)
    log.info("A2A server started", { port: args.port })

    // Keep process alive
    await new Promise(() => {})
  },
})
