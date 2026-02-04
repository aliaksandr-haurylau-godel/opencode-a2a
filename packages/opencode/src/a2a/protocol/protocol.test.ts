import { describe, expect, test } from "bun:test"
import { Protocol } from "./protocol"

describe("A2A Protocol", () => {
  test("validates a JSON-RPC request", () => {
    const validRequest = {
      jsonrpc: "2.0",
      method: "testMethod",
      params: { foo: "bar" },
      id: 1,
    }
    const result = Protocol.JsonRpcRequest.safeParse(validRequest)
    expect(result.success).toBe(true)
  })

  test("validates a JSON-RPC notification", () => {
    const validNotification = {
      jsonrpc: "2.0",
      method: "notify",
      params: [1, 2, 3],
    }
    const result = Protocol.JsonRpcNotification.safeParse(validNotification)
    expect(result.success).toBe(true)
  })

  test("validates an Agent Card", () => {
    const validCard = {
      name: "Test Agent",
      description: "A test agent",
      version: "1.0.0",
      capabilities: ["task", "chat"],
    }
    const result = Protocol.AgentCard.safeParse(validCard)
    expect(result.success).toBe(true)
  })
})
