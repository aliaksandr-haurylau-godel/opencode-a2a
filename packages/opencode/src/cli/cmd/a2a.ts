import { Log } from "@/util/log"
import { bootstrap } from "../bootstrap"
import { cmd } from "./cmd"
import { A2AServer } from "@/a2a/server"
import { Server } from "@/server/server"
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
        default: 0,
      })
      .option("hostname", {
        type: "string",
        describe: "hostname to listen on",
        default: "127.0.0.1",
      })
  },
  handler: async (args) => {
    await bootstrap(process.cwd(), async () => {
      // We need to start the main server to access OpenCode capabilities?
      // Or does bootstrap handle that?
      // Bootstrap initializes the environment but doesn't start the HTTP server.
      // However, we need `OpencodeClient` which talks to the main server.
      // So we must start the main server too, or run in-process if possible.
      // ACP command starts `Server.listen` then connects to it.

      const server = Server.listen({
        port: 0, // Random port for internal server
        hostname: "127.0.0.1",
      })

      const sdk = createOpencodeClient({
        baseUrl: `http://${server.hostname}:${server.port}`,
      })

      // Wait for server to be ready?
      // It should be ready immediately after listen() returns.

      const a2aPort = args.port || 3000
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
