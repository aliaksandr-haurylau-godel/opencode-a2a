import { Agent } from "../../../agent/agent"

export interface AgentService {
  list(): Promise<Agent.Info[]>
  get(name: string): Promise<Agent.Info | undefined>
}

export class DefaultAgentService implements AgentService {
  async list() {
    return Agent.list()
  }

  async get(name: string) {
    return Agent.get(name)
  }
}
