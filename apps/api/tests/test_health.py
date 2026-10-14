def test_health_endpoint_structure(client):
    """Verifies that /api/v1/health returns the correct structured schema."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    assert "status" in data
    assert data["status"] in ["ok", "degraded"]
    assert "version" in data
    assert data["version"] == "3.0.0"
    assert "environment" in data
    assert "timestamp" in data
    assert "database" in data
    assert data["database"] in ["connected", "disconnected"]

    # Ensure sensitive system details are not leaked
    assert "password" not in str(data).lower()
    assert "secret" not in str(data).lower()
    assert "postgresql://" not in str(data)


def test_root_endpoint(client):
    """Verifies that root entrypoint provides API metadata and links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "SABTRACK API"
    assert "/api/v1/docs" in data["docs_url"]
    assert "/api/v1/health" in data["health_url"]


def test_not_found_returns_structured_error(client):
    """Verifies that 404 errors adhere to the standard error envelope."""
    response = client.get("/api/v1/nonexistent-route-xyz")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "HTTP_404"
    assert "message" in data["error"]
