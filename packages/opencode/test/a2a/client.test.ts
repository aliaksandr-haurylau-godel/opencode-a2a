import { describe, expect, test, mock } from "bun:test"
import { A2AClient } from "../../src/a2a/client/client"

describe("A2AClient", () => {
  test("initializes with endpoint", () => {
    const client = new A2AClient("http://localhost:3000")
    expect(client).toBeDefined()
  })

  test("can send JSON-RPC request", async () => {
    const originalFetch = global.fetch
    const fetchMock = mock(async () => {
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "pong" }))
    })
    global.fetch = fetchMock

    try {
      const client = new A2AClient("http://localhost:3000")
      const result = await client.request("ping", {})
      expect(result).toBe("pong")
      expect(fetchMock).toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })
})
