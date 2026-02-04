# A2A Architecture

## Overview
This document outlines the architecture for integrating the Agent-to-Agent (A2A) Protocol v0.3.0 into OpenCode.

## Principles
- **Clean Architecture**: The core OpenCode logic (Agents, Skills, Sessions) should remain ignorant of the A2A protocol details. An adapter layer will handle the translation.
- **Transport Agnostic**: The system is designed to support multiple transports. Initially, JSON-RPC over HTTP is implemented, but the internal interfaces will support others (e.g., WebSocket, stdio).
- **SOLID**:
    - **S**: Separate classes for Transport, Protocol, Client, and Server.
    - **O**: Open for extension (new transports), closed for modification.
    - **L**: A2A Client should be substitutable for internal Agent references where applicable.
    - **I**: Interface segregation for different protocol capabilities.
    - **D**: Dependency Injection for transports.

## Component Design

### 1. Transport Layer (`src/a2a/transport/`)
- `Transport` Interface: Defines `send`, `receive`, `listen`.
- `JsonRpcHttpTransport`: Concrete implementation.

### 2. Protocol Layer (`src/a2a/protocol/`)
- Type definitions for A2A v0.3.0 messages.
- Validation logic (Zod schemas).

### 3. Server (`src/a2a/server/`)
- `A2AServer`: The main entry point. Accepts a `Transport` and an `Adapter`.
- `Adapter`: Translates A2A requests -> OpenCode internal calls -> A2A responses.
- `Router`: Routes JSON-RPC methods to specific handlers.

### 4. Client (`src/a2a/client/`)
- `A2AClient`: Connects to remote A2A agents.
- Can be wrapped as an `OpenCode.Skill` or `OpenCode.Agent` to be usable by the core system.

## Data Flow (Server)
`External Request` -> `Transport` -> `Router` -> `Adapter` -> `OpenCode Core` -> `Adapter` -> `Router` -> `Transport` -> `External Response`
