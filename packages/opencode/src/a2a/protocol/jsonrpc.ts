export namespace JsonRpc {
  export function success(id: string | number | null, result: any) {
    return {
      jsonrpc: "2.0",
      id,
      result,
    }
  }

  export function error(id: string | number | null, code: number, message: string, data?: any) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        data,
      },
    }
  }

  export const Errors = {
    ParseError: -32700,
    InvalidRequest: -32600,
    MethodNotFound: -32601,
    InvalidParams: -32602,
    InternalError: -32603,
  }
}
