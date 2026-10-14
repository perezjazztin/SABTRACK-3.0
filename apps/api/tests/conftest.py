import pytest
from starlette.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    """Provides a synchronous test client for FastAPI routes."""
    with TestClient(app) as test_client:
        yield test_client
