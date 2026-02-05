import { Agent } from "../../../agent/agent"

export interface AgentService {
  list(): Promise<Agent.Info[]>
}

export class DefaultAgentService implements AgentService {
  async list() {
    return Agent.list()
  }
}
