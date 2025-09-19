"""Contract tests for review creation endpoint.

These tests validate the POST /reviews API contract.
Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest
from fastapi.testclient import TestClient


class TestReviewsCreateContract:
    """Test POST /reviews endpoint contract compliance."""
    
    @pytest.fixture
    def valid_review_data(self):
        """Valid review data per OpenAPI schema."""
        return {
            "professor_id": "2470aebd-0e8f-44df-b093-a056986afe97",  # Real VU professor ID (Jagdish Tawde)
            "ratings": {
                "clarity": 4,
                "helpfulness": 5,
                "workload": 3,
                "engagement": 4
            },
            "review_text": "Great professor, explains concepts clearly and is very helpful during office hours.",
            "semester_taken": "Fall 2024",
            "course_taken": "Data Structures and Algorithms",
            "anonymous": False,
            "anon_display_name": None
        }
    
    @pytest.fixture
    def auth_headers(self):
        """Authentication headers for authenticated requests."""
        return {"Authorization": "Bearer test-jwt-token"}
    
    def test_create_review_success_authenticated(self, client, valid_review_data, auth_headers):
        """Test successful review creation with authentication."""
        response = client.post("/v1/reviews", json=valid_review_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        
        # Validate response structure matches Review schema
        required_fields = [
            "id", "professor_id", "author_name", "ratings",
            "created_at", "updated_at", "is_flagged", "flags_count"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Validate ratings in response
        ratings = data["ratings"]
        assert ratings["clarity"] == valid_review_data["ratings"]["clarity"]
        assert ratings["helpfulness"] == valid_review_data["ratings"]["helpfulness"]
        assert ratings["workload"] == valid_review_data["ratings"]["workload"]
        assert ratings["engagement"] == valid_review_data["ratings"]["engagement"]
    
    def test_create_review_anonymous(self, client, valid_review_data, auth_headers):
        """Test anonymous review creation."""
        review_data = valid_review_data.copy()
        review_data["anonymous"] = True
        review_data["anon_display_name"] = "CS Senior 2024"
        
        response = client.post("/v1/reviews", json=review_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        
        # Author name should be anonymous display name
        assert data["author_name"] == "CS Senior 2024"
    
    def test_create_review_without_auth_anonymous_allowed(self, client, valid_review_data):
        """Test review creation without authentication (anonymous)."""
        review_data = valid_review_data.copy()
        review_data["anonymous"] = True
        review_data["anon_display_name"] = "Anonymous Student"
        
        response = client.post("/v1/reviews", json=review_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["author_name"] == "Anonymous Student"
    
    def test_create_review_without_auth_named_rejected(self, client, valid_review_data):
        """Test named review creation without authentication is rejected."""
        review_data = valid_review_data.copy()
        review_data["anonymous"] = False
        
        response = client.post("/v1/reviews", json=review_data)
        
        assert response.status_code == 401
        error_data = response.json()
        assert error_data["error"] == "authentication_required"
    
    def test_create_review_missing_required_fields(self, client, auth_headers):
        """Test validation of required fields."""
        # Missing professor_id
        invalid_data = {
            "ratings": {
                "clarity": 4,
                "helpfulness": 5,
                "workload": 3,
                "engagement": 4
            }
        }
        
        response = client.post("/v1/reviews", json=invalid_data, headers=auth_headers)
        assert response.status_code == 400
        
        error_data = response.json()
        assert "error" in error_data
        assert error_data["error"] == "validation_error"
    
    def test_create_review_invalid_rating_values(self, client, valid_review_data, auth_headers):
        """Test validation of rating value ranges."""
        # Rating too high
        invalid_data = valid_review_data.copy()
        invalid_data["ratings"]["clarity"] = 6
        
        response = client.post("/v1/reviews", json=invalid_data, headers=auth_headers)
        assert response.status_code == 400
        
        # Rating too low  
        invalid_data["ratings"]["clarity"] = 0
        response = client.post("/v1/reviews", json=invalid_data, headers=auth_headers)
        assert response.status_code == 400
    
    def test_create_review_text_length_validation(self, client, valid_review_data, auth_headers):
        """Test review text length validation."""
        # Text too long (over 2000 chars)
        invalid_data = valid_review_data.copy()
        invalid_data["review_text"] = "a" * 2001
        
        response = client.post("/v1/reviews", json=invalid_data, headers=auth_headers)
        assert response.status_code == 400
        
        error_data = response.json()
        assert "validation_error" in error_data["error"]
    
    def test_create_review_duplicate_prevention(self, client, valid_review_data, auth_headers):
        """Test prevention of duplicate reviews by same user for same professor."""
        # First review should succeed
        response1 = client.post("/v1/reviews", json=valid_review_data, headers=auth_headers)
        assert response1.status_code == 201
        
        # Second review for same professor should fail
        response2 = client.post("/v1/reviews", json=valid_review_data, headers=auth_headers)
        assert response2.status_code == 409
        
        error_data = response2.json()
        assert "already reviewed" in error_data["message"].lower()
    
    def test_create_review_invalid_professor_id(self, client, valid_review_data, auth_headers):
        """Test handling of non-existent professor ID."""
        invalid_data = valid_review_data.copy()
        invalid_data["professor_id"] = "999e9999-e99b-99d3-a999-999999999999"
        
        response = client.post("/v1/reviews", json=invalid_data, headers=auth_headers)
        assert response.status_code == 400
        
        error_data = response.json()
        assert "professor" in error_data["message"].lower()
    
    def test_create_review_optional_fields(self, client, auth_headers):
        """Test review creation with only required fields."""
        minimal_data = {
            "professor_id": "123e4567-e89b-12d3-a456-426614174000",
            "ratings": {
                "clarity": 4,
                "helpfulness": 5,
                "workload": 3,
                "engagement": 4
            }
        }
        
        response = client.post("/v1/reviews", json=minimal_data, headers=auth_headers)
        assert response.status_code == 201
        
        data = response.json()
        # Optional fields should be null or have defaults
        assert data["review_text"] is None
        assert data["semester_taken"] is None
        assert data["course_taken"] is None
    
    def test_create_review_response_content_type(self, client, valid_review_data, auth_headers):
        """Test response content type is JSON."""
        response = client.post("/v1/reviews", json=valid_review_data, headers=auth_headers)
        assert response.headers["content-type"] == "application/json"
