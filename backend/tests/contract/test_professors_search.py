"""Contract tests for professor search endpoint.

These tests validate the API contract as defined in the OpenAPI specification.
Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest
import httpx
from fastapi.testclient import TestClient


class TestProfessorsSearchContract:
    """Test GET /professors endpoint contract compliance."""
    
    @pytest.fixture
    def client(self):
        """FastAPI test client - will fail until main app exists."""
        # This will fail initially - that's expected for TDD RED phase
        from src.main import app  # Import will fail until app exists
        return TestClient(app)
    
    def test_search_professors_success_response_structure(self, client):
        """Test successful search response matches OpenAPI schema."""
        response = client.get("/v1/professors", params={"q": "test professor"})
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure per OpenAPI spec
        assert "professors" in data
        assert "total" in data
        assert "has_more" in data
        assert isinstance(data["professors"], list)
        assert isinstance(data["total"], int)
        assert isinstance(data["has_more"], bool)
    
    def test_search_professors_with_filters(self, client):
        """Test search with all filter parameters."""
        params = {
            "q": "Dr. Sharma",
            "college_id": "123e4567-e89b-12d3-a456-426614174000",
            "college_name": "IIT Delhi",
            "department": "Computer Science",
            "state": "Delhi",
            "limit": 10,
            "offset": 0
        }
        
        response = client.get("/v1/professors", params=params)
        assert response.status_code == 200
        
        data = response.json()
        # Should not exceed limit
        assert len(data["professors"]) <= params["limit"]
    
    def test_search_professors_professor_object_structure(self, client):
        """Test individual professor object structure in response."""
        response = client.get("/v1/professors", params={"q": "test"})
        
        assert response.status_code == 200
        data = response.json()
        
        if data["professors"]:
            professor = data["professors"][0]
            required_fields = [
                "id", "first_name", "last_name", "department", 
                "college", "avg_ratings", "total_reviews"
            ]
            
            for field in required_fields:
                assert field in professor
            
            # Validate nested college object
            college = professor["college"]
            college_fields = ["id", "name", "city", "state", "college_type"]
            for field in college_fields:
                assert field in college
            
            # Validate avg_ratings object
            ratings = professor["avg_ratings"]
            rating_fields = ["clarity", "helpfulness", "workload", "engagement", "overall"]
            for field in rating_fields:
                assert field in ratings
    
    def test_search_professors_bad_request_validation(self, client):
        """Test validation of query parameters."""
        # Test with invalid limit (too high)
        response = client.get("/v1/professors", params={"limit": 100})
        assert response.status_code == 422  # FastAPI returns 422 for validation errors
        
        error_data = response.json()
        assert "error" in error_data  # Our app uses custom error format
        assert "message" in error_data
    
    def test_search_professors_empty_query_handling(self, client):
        """Test handling of empty or minimal queries."""
        # Test with empty query - should return all professors
        response = client.get("/v1/professors")
        assert response.status_code == 200  # Empty query should work
        
        # Test with single character - should work
        response = client.get("/v1/professors", params={"q": "a"})
        assert response.status_code == 200  # Single char should work
        
        # Test with acceptable query
        response = client.get("/v1/professors", params={"q": "ab"})
        assert response.status_code == 200
    
    def test_search_professors_pagination(self, client):
        """Test pagination parameters work correctly."""
        # First page
        response1 = client.get("/v1/professors", params={"q": "test", "limit": 5, "offset": 0})
        assert response1.status_code == 200
        
        # Second page
        response2 = client.get("/v1/professors", params={"q": "test", "limit": 5, "offset": 5})
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # If there are results, they should be different between pages
        if data1["professors"] and data2["professors"]:
            prof1_ids = {p["id"] for p in data1["professors"]}
            prof2_ids = {p["id"] for p in data2["professors"]}
            assert prof1_ids != prof2_ids  # Different results
    
    def test_search_professors_content_type(self, client):
        """Test response content type is JSON."""
        response = client.get("/v1/professors", params={"q": "test"})
        assert response.headers["content-type"] == "application/json"
