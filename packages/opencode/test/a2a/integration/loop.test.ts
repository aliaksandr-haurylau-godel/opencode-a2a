import { describe, expect, test, afterAll } from "bun:test"
import { A2AServer } from "../../../src/a2a/server/server"
import { A2AClient } from "../../../src/a2a/client/client"

describe("A2A Integration", () => {
  const PORT = 4001
  const server = new A2AServer({ port: PORT })
  let serverInstance: any

  test("starts server", async () => {
    serverInstance = await server.start()
    expect(serverInstance).toBeDefined()
  })

  test("client discovers server capabilities", async () => {
    const res = await fetch(`http://localhost:${PORT}/.well-known/a2a.json`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.a2a_version).toBe("0.3.0")
  })

  test("client connects to server via JSON-RPC", async () => {
    const client = new A2AClient(`http://localhost:${PORT}`)
    // This is a placeholder test; the current server mock just returns "ok"
    // In a real scenario, this would test a specific method
    const result = await client.request("ping", {})
    expect(result).toBe("ok")
  })

  afterAll(() => {
    serverInstance?.stop()
  })
})
