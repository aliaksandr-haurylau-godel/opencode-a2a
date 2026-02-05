export interface Transport {
  start(): Promise<void>
  stop(): Promise<void>
  onMessage(handler: (message: any) => Promise<any>): void
}
