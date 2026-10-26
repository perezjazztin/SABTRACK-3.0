import asyncio
from typing import List, Dict, Any
from fastapi import WebSocket
from app.core.logging import logger


class ConnectionManager:
    """Manages active WebSocket client connections and broadcasts real-time events."""

    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []
        self._loop: asyncio.AbstractEventLoop | None = None

    async def connect(self, websocket: WebSocket) -> None:
        self._loop = asyncio.get_running_loop()
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket client connected. Active connections: %d", len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected. Active connections: %d", len(self.active_connections))

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

        for dead in dead_connections:
            self.disconnect(dead)

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


# Global singleton instance for cross-module broadcast dispatch
ws_manager = ConnectionManager()
