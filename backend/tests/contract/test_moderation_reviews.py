"""Contract tests for moderation reviews endpoint.

These tests validate the GET /moderation/reviews API contract.
Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest
from fastapi.testclient import TestClient


class TestModerationReviewsContract:
    """Test GET /moderation/reviews endpoint contract compliance."""
    
    @pytest.fixture
    def auth_headers(self):
        """Authentication headers for moderator user."""
        return {"Authorization": "Bearer test-jwt-token"}
    
    @pytest.fixture
    def admin_headers(self):
        """Authentication headers for admin user."""
        return {"Authorization": "Bearer admin-jwt-token"}
    
    @pytest.fixture
    def regular_user_headers(self):
        """Authentication headers for regular user."""
        return {"Authorization": "Bearer test-jwt-token"}
    
    def test_get_flagged_reviews_success(self, client, admin_headers):
        """Test successful retrieval of flagged reviews."""
        response = client.get("/v1/moderation/reviews", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure per OpenAPI spec
        assert "reviews" in data
        assert "total" in data
        assert isinstance(data["reviews"], list)
        assert isinstance(data["total"], int)
        
        # If flagged reviews exist, validate structure
        if data["reviews"]:
            review = data["reviews"][0]
            required_fields = [
                "id", "professor_id", "user_id", "review_text", 
                "ratings", "flags", "status", "created_at"
            ]
            
            for field in required_fields:
                assert field in review
    
    def test_get_flagged_reviews_unauthorized(self, client):
        """Test accessing flagged reviews without authentication."""
        response = client.get("/v1/moderation/reviews")
        assert response.status_code == 401
        
        data = response.json()
        assert "error" in data
        assert "unauthorized" in data["error"].lower() or "authentication" in data["error"].lower()
    
    def test_get_flagged_reviews_forbidden(self, client, regular_user_headers):
        """Test accessing flagged reviews without admin privileges."""
        response = client.get("/v1/moderation/reviews", headers=regular_user_headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "forbidden" in data["error"].lower() or "permission" in data["error"].lower()
    
    def test_get_flagged_reviews_filter_by_status(self, client, admin_headers):
        """Test filtering flagged reviews by status."""
        valid_statuses = ["pending", "approved", "removed"]
        
        for status in valid_statuses:
            response = client.get("/v1/moderation/reviews", 
                                params={"status": status}, 
                                headers=admin_headers)
            
            assert response.status_code == 200
            data = response.json()
            
            # If reviews exist, they should have the requested status
            if data["reviews"]:
                for review in data["reviews"]:
                    assert review["status"] == status
    
    def test_get_flagged_reviews_invalid_status(self, client, admin_headers):
        """Test filtering with invalid status value."""
        response = client.get("/v1/moderation/reviews", 
                            params={"status": "invalid_status"}, 
                            headers=admin_headers)
        assert response.status_code == 422
    
    def test_get_flagged_reviews_default_status(self, client, admin_headers):
        """Test that default status filter is 'pending'."""
        response = client.get("/v1/moderation/reviews", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # If reviews exist, they should be pending by default
        if data["reviews"]:
            for review in data["reviews"]:
                assert review["status"] == "pending"
    
    def test_get_flagged_reviews_pagination_limits(self, client, admin_headers):
        """Test flagged reviews pagination limits."""
        # Test minimum limit
        response = client.get("/v1/moderation/reviews", 
                            params={"limit": 1}, 
                            headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["reviews"]) <= 1
        
        # Test maximum limit
        response = client.get("/v1/moderation/reviews", 
                            params={"limit": 100}, 
                            headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["reviews"]) <= 100
        
        # Test default limit (should be 20)
        response = client.get("/v1/moderation/reviews", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["reviews"]) <= 20
    
    def test_get_flagged_reviews_invalid_limit(self, client, admin_headers):
        """Test flagged reviews with invalid limit values."""
        # Limit too high
        response = client.get("/v1/moderation/reviews", 
                            params={"limit": 101}, 
                            headers=admin_headers)
        assert response.status_code == 422
        
        # Limit too low
        response = client.get("/v1/moderation/reviews", 
                            params={"limit": 0}, 
                            headers=admin_headers)
        assert response.status_code == 422
        
        # Negative limit
        response = client.get("/v1/moderation/reviews", 
                            params={"limit": -1}, 
                            headers=admin_headers)
        assert response.status_code == 422
    
    def test_get_flagged_reviews_flag_structure(self, client, admin_headers):
        """Test that flagged reviews contain proper flag information."""
        response = client.get("/v1/moderation/reviews", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # If reviews exist, validate flag structure
        if data["reviews"]:
            review = data["reviews"][0]
            if "flags" in review and review["flags"]:
                flag = review["flags"][0]
                flag_fields = ["id", "reason", "description", "flagged_by", "created_at"]
                
                for field in flag_fields:
                    assert field in flag
                
                # Validate flag reason is from valid enum
                valid_reasons = [
                    "inappropriate_content", "spam", "fake_review", 
                    "harassment", "off_topic", "other"
                ]
                assert flag["reason"] in valid_reasons
    
    def test_get_flagged_reviews_no_results(self, client, admin_headers):
        """Test flagged reviews when no flagged reviews exist."""
        # Try to get reviews with a status that might have no results
        response = client.get("/v1/moderation/reviews", 
                            params={"status": "approved"}, 
                            headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return empty array, not error
        assert data["reviews"] == [] or isinstance(data["reviews"], list)
        assert data["total"] >= 0