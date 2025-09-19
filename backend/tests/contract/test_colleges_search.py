"""Contract tests for colleges search endpoint.

These tests validate the GET /colleges API contract.
Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest
from fastapi.testclient import TestClient


class TestCollegesSearchContract:
    """Test GET /colleges endpoint contract compliance."""
    
    @pytest.fixture
    def client(self):
        """FastAPI test client."""
        from src.main import app
        return TestClient(app)
    
    def test_search_colleges_success_response_structure(self, client):
        """Test successful colleges search response matches OpenAPI schema."""
        response = client.get("/v1/colleges", params={"q": "IIT"})
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure per OpenAPI spec
        assert "colleges" in data
        assert "total" in data
        assert isinstance(data["colleges"], list)
        assert isinstance(data["total"], int)
        
        # If colleges exist, validate college structure
        if data["colleges"]:
            college = data["colleges"][0]
            required_fields = ["id", "name", "city", "state", "college_type"]
            
            for field in required_fields:
                assert field in college
    
    def test_search_colleges_with_all_filters(self, client):
        """Test colleges search with all filter parameters."""
        params = {
            "q": "Indian Institute",
            "state": "Delhi",
            "city": "New Delhi",
            "limit": 10
        }
        
        response = client.get("/v1/colleges", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert "colleges" in data
        assert "total" in data
        
        # Verify limit is respected
        assert len(data["colleges"]) <= 10
    
    def test_search_colleges_by_state(self, client):
        """Test colleges search filtered by state."""
        response = client.get("/v1/colleges", params={"state": "Maharashtra"})
        
        assert response.status_code == 200
        data = response.json()
        
        # If results exist, they should be from Maharashtra
        if data["colleges"]:
            for college in data["colleges"]:
                assert college["state"] == "Maharashtra"
    
    def test_search_colleges_by_city(self, client):
        """Test colleges search filtered by city."""
        response = client.get("/v1/colleges", params={"city": "Mumbai"})
        
        assert response.status_code == 200
        data = response.json()
        
        # If results exist, they should be from Mumbai
        if data["colleges"]:
            for college in data["colleges"]:
                assert college["city"] == "Mumbai"
    
    def test_search_colleges_pagination_limits(self, client):
        """Test colleges search pagination limits."""
        # Test minimum limit
        response = client.get("/v1/colleges", params={"limit": 1})
        assert response.status_code == 200
        data = response.json()
        assert len(data["colleges"]) <= 1
        
        # Test maximum limit
        response = client.get("/v1/colleges", params={"limit": 50})
        assert response.status_code == 200
        data = response.json()
        assert len(data["colleges"]) <= 50
        
        # Test default limit (should be 20)
        response = client.get("/v1/colleges")
        assert response.status_code == 200
        data = response.json()
        assert len(data["colleges"]) <= 20
    
    def test_search_colleges_invalid_limit(self, client):
        """Test colleges search with invalid limit values."""
        # Limit too high
        response = client.get("/v1/colleges", params={"limit": 100})
        assert response.status_code == 422
        
        # Limit too low
        response = client.get("/v1/colleges", params={"limit": 0})
        assert response.status_code == 422
        
        # Negative limit
        response = client.get("/v1/colleges", params={"limit": -1})
        assert response.status_code == 422
    
    def test_search_colleges_query_length_validation(self, client):
        """Test colleges search query length validation."""
        # Query too short
        response = client.get("/v1/colleges", params={"q": "a"})
        assert response.status_code == 422
        
        # Query too long (over 100 characters)
        long_query = "a" * 101
        response = client.get("/v1/colleges", params={"q": long_query})
        assert response.status_code == 422
    
    def test_search_colleges_state_validation(self, client):
        """Test colleges search with invalid state parameter."""
        # State name too long (over 50 characters)
        long_state = "a" * 51
        response = client.get("/v1/colleges", params={"state": long_state})
        assert response.status_code == 422
    
    def test_search_colleges_city_validation(self, client):
        """Test colleges search with invalid city parameter."""
        # City name too long (over 100 characters)
        long_city = "a" * 101
        response = client.get("/v1/colleges", params={"city": long_city})
        assert response.status_code == 422
    
    def test_search_colleges_no_results(self, client):
        """Test colleges search with no matching results."""
        response = client.get("/v1/colleges", params={"q": "NonExistentCollegeName12345"})
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["colleges"] == []
        assert data["total"] == 0
    
    def test_search_colleges_empty_query(self, client):
        """Test colleges search without query parameter."""
        response = client.get("/v1/colleges")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return all colleges (up to limit)
        assert "colleges" in data
        assert "total" in data
        assert isinstance(data["colleges"], list)
    
    def test_search_colleges_college_type_values(self, client):
        """Test that college type field contains valid enum values."""
        response = client.get("/v1/colleges", params={"limit": 50})
        
        assert response.status_code == 200
        data = response.json()
        
        valid_types = ["university", "college", "institute", "Private University"]  # Include real VU data
        
        # If colleges exist, validate college_type values
        if data["colleges"]:
            for college in data["colleges"]:
                if "college_type" in college:
                    assert college["college_type"] in valid_types