"""Contract tests for review update endpoint.

These tests validate the PUT /reviews/{review_id} API contract.
Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest
from fastapi.testclient import TestClient


class TestReviewsUpdateContract:
    """Test PUT /reviews/{review_id} endpoint contract compliance."""
    
    @pytest.fixture
    def valid_review_update_data(self):
        """Valid review update data per OpenAPI schema."""
        return {
            "ratings": {
                "clarity": 5,
                "helpfulness": 4,
                "workload": 2,
                "engagement": 5
            },
            "review_text": "Updated review: Even better professor than I initially thought!",
            "semester_taken": "Spring 2024",
            "course_taken": "Advanced Data Structures"
        }
    
    @pytest.fixture
    def auth_headers(self):
        """Authentication headers for authenticated requests."""
        return {"Authorization": "Bearer test-jwt-token"}
    
    @pytest.fixture
    def sample_review_id(self):
        """Sample UUID for review ID."""
        return "123e4567-e89b-12d3-a456-426614174001"
    
    def test_update_review_success(self, client, valid_review_update_data, auth_headers, sample_review_id):
        """Test successful review update."""
        response = client.put(f"/v1/reviews/{sample_review_id}", 
                            json=valid_review_update_data, 
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure matches Review schema
        required_fields = [
            "id", "professor_id", "user_id", "ratings", "review_text",
            "semester_taken", "course_taken", "created_at", "updated_at"
        ]
        
        for field in required_fields:
            assert field in data
        
        # Validate updated data is reflected
        assert data["ratings"]["clarity"] == 5
        assert "Updated review" in data["review_text"]
        assert data["semester_taken"] == "Spring 2024"
    
    def test_update_review_unauthorized(self, client, valid_review_update_data, sample_review_id):
        """Test review update without authentication."""
        response = client.put(f"/v1/reviews/{sample_review_id}", json=valid_review_update_data)
        assert response.status_code == 401
        
        data = response.json()
        assert "error" in data
        assert "unauthorized" in data["error"].lower() or "authentication" in data["error"].lower()
    
    def test_update_review_not_found(self, client, valid_review_update_data, auth_headers):
        """Test updating non-existent review."""
        non_existent_id = "123e4567-e89b-12d3-a456-999999999999"
        
        response = client.put(f"/v1/reviews/{non_existent_id}", 
                            json=valid_review_update_data, 
                            headers=auth_headers)
        assert response.status_code == 404
        
        data = response.json()
        assert "error" in data
        assert "not found" in data["error"].lower()
    
    def test_update_review_forbidden(self, client, valid_review_update_data, sample_review_id):
        """Test updating review belonging to another user."""
        # Different user's token
        other_user_headers = {"Authorization": "Bearer other-user-jwt-token"}
        
        response = client.put(f"/v1/reviews/{sample_review_id}", 
                            json=valid_review_update_data, 
                            headers=other_user_headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "forbidden" in data["error"].lower() or "permission" in data["error"].lower()
    
    def test_update_review_invalid_uuid(self, client, valid_review_update_data, auth_headers):
        """Test updating review with invalid UUID format."""
        invalid_id = "not-a-valid-uuid"
        
        response = client.put(f"/v1/reviews/{invalid_id}", 
                            json=valid_review_update_data, 
                            headers=auth_headers)
        assert response.status_code == 422
    
    def test_update_review_invalid_ratings(self, client, auth_headers, sample_review_id):
        """Test review update with invalid ratings."""
        # Rating out of range (should be 1-5)
        invalid_data = {
            "ratings": {
                "clarity": 6,  # Invalid - too high
                "helpfulness": 4,
                "workload": 0,  # Invalid - too low
                "engagement": 3
            },
            "review_text": "Updated review text"
        }
        
        response = client.put(f"/v1/reviews/{sample_review_id}", 
                            json=invalid_data, 
                            headers=auth_headers)
        assert response.status_code == 422
    
    def test_update_review_missing_ratings(self, client, auth_headers, sample_review_id):
        """Test review update with incomplete ratings."""
        invalid_data = {
            "ratings": {
                "clarity": 4,
                "helpfulness": 5
                # Missing workload and engagement
            },
            "review_text": "Updated review text"
        }
        
        response = client.put(f"/v1/reviews/{sample_review_id}", 
                            json=invalid_data, 
                            headers=auth_headers)
        assert response.status_code == 422
    
    def test_update_review_empty_text(self, client, auth_headers, sample_review_id):
        """Test review update with empty review text."""
        invalid_data = {
            "ratings": {
                "clarity": 4,
                "helpfulness": 5,
                "workload": 3,
                "engagement": 4
            },
            "review_text": ""  # Empty text should be invalid
        }
        
        response = client.put(f"/v1/reviews/{sample_review_id}", 
                            json=invalid_data, 
                            headers=auth_headers)
        assert response.status_code == 422
    
    def test_update_review_partial_update(self, client, auth_headers, sample_review_id):
        """Test partial review update (only some fields)."""
        partial_data = {
            "review_text": "Only updating the text content"
        }
        
        response = client.put(f"/v1/reviews/{sample_review_id}", 
                            json=partial_data, 
                            headers=auth_headers)
        # Should still require ratings for full update
        assert response.status_code in [200, 422]  # Depends on API design