import { cmd } from "./cmd"
import { Log } from "@/util/log"
import { A2AServer } from "../../a2a/server/server"

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
    const server = new A2AServer({ port: args.port })
    await server.start()
    log.info("A2A server started", { port: args.port })

    // Keep process alive
    await new Promise(() => {})
  },
})
