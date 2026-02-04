export class A2AClient {
  private endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  async request(method: string, params: any) {
    const response = await fetch(`${this.endpoint}/a2a`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: Math.floor(Math.random() * 1000000),
      }),
    })

    if (!response.ok) {
      throw new Error(`A2A request failed: ${response.statusText}`)
    }

    const data = await response.json()
    if (data.error) {
      throw new Error(`A2A error: ${data.error.message}`)
    }

    return data.result
  }
}
