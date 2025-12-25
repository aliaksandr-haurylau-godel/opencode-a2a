import type { TaskStore } from "@a2a-js/sdk/server"
import type { Task } from "@a2a-js/sdk"
import { InMemoryTaskStore } from "@a2a-js/sdk/server"

export class OpenCodeTaskStore implements TaskStore {
  private baseStore = new InMemoryTaskStore()
  private taskToSession = new Map<string, string>()

  async save(task: Task): Promise<void> {
    await this.baseStore.save(task)
  }

  async load(taskId: string): Promise<Task | undefined> {
    return this.baseStore.load(taskId)
  }

  setSessionId(taskId: string, sessionId: string) {
    this.taskToSession.set(taskId, sessionId)
  }

  getSessionId(taskId: string): string | undefined {
    return this.taskToSession.get(taskId)
  }
}
