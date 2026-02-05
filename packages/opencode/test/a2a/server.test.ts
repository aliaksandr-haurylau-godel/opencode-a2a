import { describe, expect, test, mock } from "bun:test"
import { A2AServer } from "../../src/a2a/server/server"
import { HttpTransport } from "../../src/a2a/transport/http-transport"
import { TaskHandler } from "../../src/a2a/server/handlers/task"

const mockAgentService = {
  list: mock(async () => []),
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
})
