import { OpencodeClient } from "@opencode-ai/sdk/v2"

export interface SessionService {
  create(task: string): Promise<string>
  get(sessionId: string): Promise<{ id: string; status: "pending" | "running" | "completed" | "failed" }>
  postMessage(sessionId: string, content: string): Promise<string>
}

export class DefaultSessionService implements SessionService {
  private client: OpencodeClient

  constructor(client: OpencodeClient) {
    this.client = client
  }

  async create(task: string): Promise<string> {
    const session = await this.client.session.create({
      title: task,
      directory: process.cwd(),
    }).then(r => r.data)

    if (!session) {
      throw new Error("Failed to create session")
    }

    // Initialize session with task
    // We assume default model/agent for now
    // In a full implementation, we'd pick this from config or params
    try {
      await this.client.session.prompt({
        sessionID: session.id,
        directory: process.cwd(),
        parts: [{ type: "text", text: task }],
        model: { providerID: "opencode", modelID: "big-pickle" },
        agent: "build",
      })
    } catch (e) {
      // Prompt might fail if no providers configured, but session exists
      console.warn("Failed to prompt session:", e)
    }

    return session.id
  }

  async get(sessionId: string): Promise<{ id: string; status: "pending" | "running" | "completed" | "failed" }> {
    const session = await this.client.session.get({
      sessionID: sessionId,
      directory: process.cwd(),
    }).then(r => r.data)

    if (!session) {
      throw new Error("Session not found")
    }

    // Basic mapping: OpenCode sessions are generally "running" or "completed"
    return {
      id: sessionId,
      status: "running",
    }
  }

  async postMessage(sessionId: string, content: string): Promise<string> {
    const response = await this.client.session.prompt({
      sessionID: sessionId,
      directory: process.cwd(),
      parts: [{ type: "text", text: content }],
      model: { providerID: "opencode", modelID: "big-pickle" },
      agent: "build",
    }).then(r => r.data)

    if (!response) {
      throw new Error("Failed to post message")
    }

    return "message_sent"
  }
}
