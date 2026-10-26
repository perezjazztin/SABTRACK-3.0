from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket import ws_manager
from app.core.logging import logger

router = APIRouter()


@router.websocket("/ws")
async def websocket_realtime_endpoint(websocket: WebSocket):
    """Real-time event notification stream for portal auto-synchronization."""
    await ws_manager.connect(websocket)
    try:
        # Send initial connected handshake confirmation
        await websocket.send_json({"type": "CONNECTED", "message": "SABTRACK real-time sync active"})
        while True:
            # Keep socket alive and respond to client heartbeat ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as exc:
        logger.debug("WebSocket connection closed: %s", exc)
        ws_manager.disconnect(websocket)
