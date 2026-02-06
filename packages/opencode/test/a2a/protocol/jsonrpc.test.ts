import { describe, expect, test } from "bun:test"
import { JsonRpc } from "../../../src/a2a/protocol/jsonrpc"

describe("JsonRpc", () => {
  test("creates success response", () => {
    const res = JsonRpc.success("id-1", { foo: "bar" })
    expect(res).toEqual({
      jsonrpc: "2.0",
      id: "id-1",
      result: { foo: "bar" },
    })
  })

  test("creates error response", () => {
    const res = JsonRpc.error("id-1", -32600, "Invalid Request")
    expect(res).toEqual({
      jsonrpc: "2.0",
      id: "id-1",
      error: {
        code: -32600,
        message: "Invalid Request",
      },
    })
  })
})
