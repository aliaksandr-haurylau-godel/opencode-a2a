import { describe, expect, test, mock } from "bun:test"
import { A2AServer } from "../../src/a2a/server/server"

describe("A2AServer", () => {
  test("initializes with configuration", () => {
    const server = new A2AServer({ port: 3000 })
    expect(server).toBeDefined()
  })

  test("defines agent card route", async () => {
    const server = new A2AServer({ port: 3000 })
    const res = await server.fetch(new Request("http://localhost:3000/.well-known/a2a.json"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.a2a_version).toBe("0.3.0")
  })
})
