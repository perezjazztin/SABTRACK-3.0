import pytest
from unittest.mock import patch, MagicMock
from app.modules.chatbot.service import scrub_pii, _CACHE, reset_chatbot_cache

def test_pii_scrubbing():
    """Verify citizen emails and phone numbers are redacted (RA 10173)."""
    text = "Hello, my email is citizen.juan@gmail.com and my mobile is 09171234567. How to recycle?"
    clean = scrub_pii(text)
    assert "[REDACTED_EMAIL]" in clean
    assert "citizen.juan@gmail.com" not in clean
    assert "[REDACTED_PHONE]" in clean
    assert "09171234567" not in clean

def test_get_quick_prompts(client):
    """Verify initial suggestion prompt chips are retrieved successfully."""
    response = client.get("/api/v1/chatbot/prompts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    categories = [p["category"] for p in data]
    assert "UPCYCLING" in categories
    assert "SCHEDULE" in categories

def test_query_ecobot_upcycling_offline_fallback(client):
    """Verify local upcycling project matching works without external API keys."""
    reset_chatbot_cache()

    payload = {
        "message": "Paano gawing kapaki-pakinabang ang mga balat ng prutas at gulay?",
    }
    with patch("app.modules.chatbot.service.get_api_keys", return_value=[]):
        response = client.post("/api/v1/chatbot/query", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert data["is_fallback"] is True
        assert data["model_used"] == "ecobot-curated-local"
        assert "compost" in data["reply"].lower() or "kitchen" in data["reply"].lower()
        
        # Verify featured project structure
        featured = data["featured_project"]
        assert featured is not None
        assert featured["title"] == "Zero-Odor Kitchen Peels Aerobic Composting"
        assert len(featured["steps"]) >= 3
        assert len(featured["materials_needed"]) >= 2

def test_query_ecobot_schedule_lookup(client):
    """Verify citizen schedule questions fetch official Barangay Sabang routes."""
    reset_chatbot_cache()
    payload = {
        "message": "Kailan ang hakot ng basura sa aming purok?",
    }
    with patch("app.modules.chatbot.service.get_api_keys", return_value=[]):
        response = client.post("/api/v1/chatbot/query", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "Iskedyul" in data["reply"] or "Schedule" in data["reply"]
        assert "Biodegradable" in data["reply"] or "Green Bag" in data["reply"]

def test_query_ecobot_caching(client):
    """Verify subsequent queries return instantly from local cache (0 API calls)."""
    reset_chatbot_cache()
    payload = {
        "message": "Paano gumawa ng eco-bricks mula sa mga plastic sachets?",
    }
    # First query -> generates response and caches
    res1 = client.post("/api/v1/chatbot/query", json=payload)
    assert res1.status_code == 200
    assert res1.json()["is_from_cache"] is False

    # Second query -> answered from cache
    res2 = client.post("/api/v1/chatbot/query", json=payload)
    assert res2.status_code == 200
    assert res2.json()["is_from_cache"] is True
    assert res2.json()["reply"] == res1.json()["reply"]

def test_query_ecobot_gemini_mocked(client, monkeypatch):
    """Verify live Gemini response with Google Search citations when key is present."""
    reset_chatbot_cache()
    monkeypatch.setattr('app.modules.chatbot.service._SEARCH_COOLDOWN_UNTIL', 0.0)
    monkeypatch.setenv('GEMINI_API_KEY', 'dummy-gemini-key')

    mock_gemini_json = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {"text": "Maaari mong gamitin ang mga plastic bottles bilang self-watering vertical pots. Narito ang mga hakbang..."}
                    ]
                },
                "groundingMetadata": {
                    "groundingChunks": [
                        {
                            "web": {
                                "uri": "https://example.com/diy-vertical-planter",
                                "title": "DIY Vertical Gardening with Plastic Bottles"
                            }
                        }
                    ]
                }
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_gemini_json

    mock_client_instance = MagicMock()
    mock_client_instance.__enter__.return_value.post.return_value = mock_resp

    with patch("app.modules.chatbot.service.httpx.Client", return_value=mock_client_instance):
        payload = {"message": "How to make a vertical garden from bottles?"}
        response = client.post("/api/v1/chatbot/query", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["is_fallback"] is False
        assert data["model_used"] in ["gemini-flash-search", "gemini-1.5-flash-search"]
        assert len(data["citations"]) == 1
        assert data["citations"][0]["title"] == "DIY Vertical Gardening with Plastic Bottles"
