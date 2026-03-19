# ADR-003: WebSocket for Real-Time Order Updates

## Status
Accepted

## Context
Staff and admin users on the dashboard need to see new orders and status changes in real time. When a customer places an order via the public API, dashboard users should see it appear immediately without refreshing. Similarly, when any staff member updates an order's status (pending → confirmed → dispatched → delivered), all connected dashboard users should see the change.

## Decision
We chose **WebSocket** using **Gorilla WebSocket** (`github.com/gorilla/websocket`) with a hub-based pub/sub architecture.

The implementation lives in `internal/ws/hub.go` with these core components:

```
Hub struct:
  clients    map[*client]bool   — connected clients
  broadcast  chan []byte         — buffered broadcast channel (size 256)
  register   chan *client        — client registration
  unregister chan *client        — client removal

client struct:
  conn *websocket.Conn
  send chan []byte               — per-client send buffer (size 256)
```

**How it works**:
1. `Hub.Run()` runs as a goroutine, selecting on register/unregister/broadcast channels
2. `HandleWS()` upgrades HTTP to WebSocket at `/api/v1/dashboard/ws` (behind auth + role middleware)
3. Each client spawns `readPump()` and `writePump()` goroutines
4. Service layer broadcasts events directly:
   - `PlaceOrder` in `internal/service/order.go` broadcasts `{"type": "new_order", "data": ...}` after successful order creation
   - `UpdateStatus` broadcasts `{"type": "status_update", "data": ...}` after status transitions

**Message format** (defined as `ws.Message`):
```go
type Message struct {
    Type string      `json:"type"`    // "new_order" or "status_update"
    Data interface{} `json:"data"`    // order details
}
```

**Integration**: The WebSocket endpoint is protected by the same auth middleware as other dashboard routes. Only authenticated staff/admin users can connect. The upgrader's `CheckOrigin` returns true (noted as a production concern in the code).

## Consequences
- **Positive**: Dashboard updates are instant. Staff sees new orders the moment they're placed — no polling delay, no missed orders between poll intervals.
- **Positive**: The hub pattern handles multiple concurrent dashboard sessions cleanly. All connected clients receive the same broadcast.
- **Positive**: Gorilla WebSocket works with `net/http` directly, integrating cleanly with Chi's routing and our auth middleware. The upgrade happens on a standard `http.HandlerFunc`.
- **Positive**: Low bandwidth — only sends data when something actually changes, unlike polling which generates constant traffic.
- **Negative**: WebSocket connections are stateful and long-lived. If the server restarts, all dashboard clients disconnect and must reconnect. We don't currently have automatic reconnection logic on the frontend.
- **Negative**: `CheckOrigin: func(r *http.Request) bool { return true }` is an open CORS policy for WebSocket upgrades. This needs to be tightened for production.
- **Negative**: The current broadcast-to-all pattern means every connected client gets every event. If we later need per-user filtering (e.g., staff only sees orders for their region), we'd need to add channel/topic support to the hub.
- **Trade-off**: Gorilla WebSocket is in maintenance mode (archived). It still works and is stable, but no new features. We accept this because our WebSocket needs are simple (broadcast only, no complex protocol).

## Alternatives Considered

### HTTP Polling
Client polls `GET /api/v1/dashboard/orders` every N seconds. Rejected because:
- Adds latency proportional to poll interval — a 5-second poll means up to 5 seconds before a new order appears
- Generates unnecessary load — most polls return no new data
- Wasteful for a dashboard that's open all day — hundreds of no-op requests per session
- Would require tracking "last seen" timestamps or cursor-based diffing on the client

### Server-Sent Events (SSE)
Unidirectional server-to-client streaming over HTTP. Considered seriously but rejected because:
- Our use case is purely server-to-client (broadcast notifications), which SSE handles well
- However, SSE has browser connection limits (6 per domain in HTTP/1.1) — if staff has multiple dashboard tabs, connections could be exhausted
- SSE doesn't work through some corporate proxies that buffer chunked responses
- WebSocket gives us the option to add client-to-server messaging later (e.g., typing indicators, acknowledgments) without changing the transport

### Third-party pub/sub (Redis, NATS)
External message broker for distributing events. Rejected because:
- Adds operational complexity (another service to deploy, monitor, and maintain)
- Our current scale is a single server instance — in-process broadcast via Go channels is simpler and faster
- If we scale to multiple server instances, we can add Redis pub/sub as a backend for the Hub without changing the WebSocket interface to clients
