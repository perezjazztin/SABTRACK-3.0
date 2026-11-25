import asyncio
from typing import List, Dict, Any
from fastapi import WebSocket
from app.core.logging import logger


# Thread-safe connection manager maintaining connected WebSocket clients and event broadcasting.
class ConnectionManager:
    """Manages active WebSocket client connections and broadcasts real-time events."""

    def __init__(self) -> None:
        # Tracks active WebSocket channels currently open with client browsers.
        self.active_connections: List[WebSocket] = []
        self._loop: asyncio.AbstractEventLoop | None = None

    # Accepts new WebSocket handshake and registers the socket in the active connection pool.
    async def connect(self, websocket: WebSocket) -> None:
        self._loop = asyncio.get_running_loop()
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket client connected. Active connections: %d", len(self.active_connections))

    # Removes a disconnected socket from the active pool to avoid sending to dropped connections.
    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected. Active connections: %d", len(self.active_connections))

    # Asynchronously broadcasts a JSON payload to all active clients and prunes broken sockets.
    async def broadcast(self, data: Dict[str, Any]) -> None:
        """Broadcasts a JSON message to all currently connected clients."""
        if not self.active_connections:
            return

        dead_connections: List[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception as exc:
                logger.warning("Failed to send WebSocket message: %s. Marking for removal.", exc)
                dead_connections.append(connection)

        # Clean up stale connections that threw network errors
        for dead in dead_connections:
            self.disconnect(dead)

    # Dispatches WebSocket broadcasts safely from synchronous contexts or background worker threads.
    def broadcast_sync(self, data: Dict[str, Any]) -> None:
        """Thread-safe synchronous broadcast dispatch for standard route handlers."""
        if not self.active_connections:
            return

        if self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast(data), self._loop)
        else:
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(self.broadcast(data))
                else:
                    loop.run_until_complete(self.broadcast(data))
            except Exception as exc:
                logger.debug("broadcast_sync fallback skipped: %s", exc)


# Global singleton instance for cross-module broadcast dispatch across routes and background tasks.
ws_manager = ConnectionManager()
