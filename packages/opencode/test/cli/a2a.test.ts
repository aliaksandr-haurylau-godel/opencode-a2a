import { describe, expect, test, mock } from "bun:test"
import { A2aCommand } from "../../src/cli/cmd/a2a"

describe("A2aCommand", () => {
  test("defines the command structure", () => {
    expect(A2aCommand.command).toBe("a2a")
    expect(A2aCommand.describe).toBeDefined()
  })

  test("has builder options", async () => {
    const yargsMock = {
      option: mock().mockReturnThis(),
    }
    await A2aCommand.builder(yargsMock as any)
    expect(yargsMock.option).toHaveBeenCalledWith("port", expect.any(Object))
  })
})
