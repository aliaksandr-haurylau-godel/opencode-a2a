import { z } from "zod"

// A2A v0.3.0 Protocol Definitions

export namespace Protocol {
  export const Version = "0.3.0"

  // Base JSON-RPC 2.0 Types
  export const JsonRpcRequest = z.object({
    jsonrpc: z.literal("2.0"),
    method: z.string(),
    params: z.any().optional(),
    id: z.union([z.string(), z.number(), z.null()]),
  })

  export const JsonRpcNotification = z.object({
    jsonrpc: z.literal("2.0"),
    method: z.string(),
    params: z.any().optional(),
  })

  export const JsonRpcResponse = z.object({
    jsonrpc: z.literal("2.0"),
    result: z.any().optional(),
    error: z
      .object({
        code: z.number(),
        message: z.string(),
        data: z.any().optional(),
      })
      .optional(),
    id: z.union([z.string(), z.number(), z.null()]),
  })

  // Agent Card (Discovery)
  export const AgentCard = z.object({
    name: z.string(),
    description: z.string(),
    version: z.string(),
    capabilities: z.array(z.string()),
  })

  // Task Capabilities
  export const Task = z.object({
    id: z.string(),
    status: z.enum(["pending", "running", "completed", "failed"]),
    result: z.any().optional(),
    error: z.string().optional(),
  })
}
