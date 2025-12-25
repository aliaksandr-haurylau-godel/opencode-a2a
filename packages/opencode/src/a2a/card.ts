import type { AgentCard, AgentSkill } from "@a2a-js/sdk"
import { Agent } from "../agent/agent"
import { Installation } from "../installation"

export async function createAgentCard(baseUrl: string): Promise<AgentCard> {
  const agents = await Agent.list()

  // Map OpenCode agents to A2A skills
  const skills: AgentSkill[] = agents.map((agent) => {
    return {
      id: agent.name,
      name: agent.name,
      description: agent.description || `The ${agent.name} agent`,
      tags: [agent.mode],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"],
    }
  })

  // Ensure there's at least one skill if the list is empty (shouldn't happen with built-ins)
  if (skills.length === 0) {
    skills.push({
      id: "default",
      name: "Default Agent",
      description: "Default OpenCode agent",
      tags: ["general"],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"],
    })
  }

  const card: AgentCard = {
    name: "OpenCode",
    version: Installation.VERSION,
    description: "AI-powered development tool with agent capabilities",
    protocolVersion: "0.3.0",
    url: baseUrl,
    preferredTransport: "HTTP+JSON",
    capabilities: {
      streaming: true,
      pushNotifications: false,
    },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain"],
    skills: skills,
  }

  return card
}
