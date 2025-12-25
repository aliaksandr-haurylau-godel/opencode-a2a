import { Log } from "@/util/log"
import { bootstrap } from "../bootstrap"
import { cmd } from "./cmd"
import { createOpencodeClient } from "@opencode-ai/sdk"

const log = Log.create({ service: "a2a-command" })

process.on("unhandledRejection", (reason, promise) => {
  log.error("Unhandled rejection", {
    promise,
    reason,
  })
})

export const A2ACommand = cmd({
  command: "a2a",
  describe: "Start A2A (Agent-to-Agent) Protocol server",
  builder: (yargs) => {
    return yargs
      .option("cwd", {
        describe: "working directory",
        type: "string",
        default: process.cwd(),
      })
      .option("port", {
        type: "number",
        describe: "port to listen on",
        default: 3000,
      })
      .option("hostname", {
        type: "string",
        describe: "hostname to listen on",
        default: "127.0.0.1",
      })
  },
  handler: async (args) => {
    await bootstrap(process.cwd(), async () => {
      // Lazy load dependencies to avoid circular imports during CLI startup
      const { A2AServer } = await import("@/a2a/server")
      const { Server } = await import("@/server/server")

      const server = Server.listen({
        port: 0, // Random port for internal server
        hostname: "127.0.0.1",
      })

      const sdk = createOpencodeClient({
        baseUrl: `http://${server.hostname}:${server.port}`,
      })

      const a2aPort = args.port
      const a2aServer = await A2AServer.listen({
        port: a2aPort,
        hostname: args.hostname,
        sdk: sdk,
      })

      log.info(`A2A server running at http://${a2aServer.hostname}:${a2aServer.port}`)

      // Keep process alive
      await new Promise(() => {})
    })
  },
})
