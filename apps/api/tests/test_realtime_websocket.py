import pytest
from starlette.testclient import TestClient
from app.core.websocket import ws_manager


def test_websocket_connect_and_handshake(client: TestClient):
    """Verifies that WebSocket handshake establishes and receives initial greeting."""
    with client.websocket_connect("/api/v1/ws") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "CONNECTED"
        assert "SABTRACK" in data["message"]

        # Verify client heartbeat response
        websocket.send_text("ping")
        assert websocket.receive_text() == "pong"


def test_connection_manager_tracks_connections(client: TestClient):
    """Verifies that active connections list correctly reflects connected socket count."""
    initial_count = len(ws_manager.active_connections)
    with client.websocket_connect("/api/v1/ws"):
        assert len(ws_manager.active_connections) == initial_count + 1
    assert len(ws_manager.active_connections) == initial_count


def test_websocket_broadcast_sync(client: TestClient):
    """Verifies that broadcast_sync delivers JSON events to connected clients."""
    with client.websocket_connect("/api/v1/ws") as websocket:
        _ = websocket.receive_json()  # initial handshake

        ws_manager.broadcast_sync({"type": "REPORT_CREATED", "entity": "reports", "id": 999})
        event = websocket.receive_json()
        assert event["type"] == "REPORT_CREATED"
        assert event["id"] == 999
