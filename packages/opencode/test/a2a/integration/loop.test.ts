import { describe, expect, test, afterAll } from "bun:test"
import { A2AServer } from "../../../src/a2a/server/server"
import { A2AClient } from "../../../src/a2a/client/client"
import { HttpTransport } from "../../../src/a2a/transport/http"
import { TaskHandler } from "../../../src/a2a/server/handlers/task"

describe("A2A Integration", () => {
  const PORT = 4001
  const transport = new HttpTransport(PORT)
  const taskHandler = new TaskHandler()
  const server = new A2AServer(transport, taskHandler)

  test("starts server", async () => {
    await server.start()
    expect(true).toBe(true)
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

  test("client can run a task", async () => {
    const client = new A2AClient(`http://localhost:${PORT}`)
    const result = await client.runTask("Write a poem")
    expect(result.status).toBe("pending")
    expect(result.taskId).toBeString()
  })

  test("client can post a message to a task", async () => {
    const client = new A2AClient(`http://localhost:${PORT}`)
    // First create a task
    const task = await client.runTask("Chat task")
    const result = await client.postMessage(task.taskId, "Hello world")
    expect(result.success).toBe(true)
    expect(result.messageId).toBeString()
  })

  afterAll(async () => {
    await server.stop()
  })
})
