export interface Transport {
  send(message: string): Promise<void>
  receive(): Promise<string>
  close(): Promise<void>
}
