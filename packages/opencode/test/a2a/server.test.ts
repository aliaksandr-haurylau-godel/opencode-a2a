import { describe, expect, test, mock } from "bun:test"
import { A2AServer } from "../../src/a2a/server/server"
import { HttpTransport } from "../../src/a2a/transport/http-transport"
import { TaskHandler } from "../../src/a2a/server/handlers/task"

const mockAgentService = {
  list: mock(async () => []),
  get: mock(async (name) => (name === "found" ? ({ name } as any) : undefined)),
}

describe("A2AServer", () => {
  test("initializes with dependencies", () => {
    const transport = new HttpTransport(3000)
    const handler = new TaskHandler(mockAgentService)
    const server = new A2AServer(transport, handler)
    expect(server).toBeDefined()
  })

  test("defines agent card route via transport", async () => {
    const transport = new HttpTransport(3000)
    const handler = new TaskHandler(mockAgentService)
    new A2AServer(transport, handler)

    const res = await transport.fetch(new Request("http://localhost:3000/.well-known/a2a.json"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.a2a_version).toBe("0.3.0")
  })

  test("returns error for unknown task", async () => {
    const transport = new HttpTransport(3002)
    const handler = new TaskHandler(mockAgentService)
    const server = new A2AServer(transport, handler)
    await server.start()

    const res = await fetch("http://localhost:3002/a2a", {
      method: "POST",
      body: JSON.stringify({ jsonrpc: "2.0", method: "tasks/get", params: { id: "unknown" }, id: 1 }),
    })
    const json = await res.json()
    expect(json.error).toBeDefined()
    expect(json.error.message).toContain("Task not found")
    await server.stop()
  })
})
