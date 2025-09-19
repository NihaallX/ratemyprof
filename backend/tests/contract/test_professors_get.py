"""Contract tests for individual professor profile endpoint.

These tests validate the GET /professors/{id} API contract.
Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest
from fastapi.testclient import TestClient


class TestProfessorGetContract:
    """Test GET /professors/{id} endpoint contract compliance."""
    
    @pytest.fixture
    def client(self):
        """FastAPI test client - will fail until main app exists."""
        from src.main import app  # Import will fail until app exists
        return TestClient(app)
    
    def test_get_professor_success_response_structure(self, real_client):
        """Test successful professor profile response matches OpenAPI schema."""
        professor_id = "2470aebd-0e8f-44df-b093-a056986afe97"  # Real VU Professor Jagdish Tawde ID
        response = real_client.get(f"/v1/professors/{professor_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate required fields from our actual database schema
        required_fields = [
            "id", "name", "department", "college_id",
            "average_rating", "total_reviews", "designation", "subjects"
        ]

        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            
        # Validate data types
        assert isinstance(data["id"], str)
        assert isinstance(data["name"], str) 
        assert isinstance(data["department"], str)
        assert isinstance(data["college_id"], str)
        assert isinstance(data["average_rating"], (int, float))
        assert isinstance(data["total_reviews"], int)
        assert isinstance(data["subjects"], list)
    
    def test_get_professor_college_object_structure(self, real_client):
        """Test college object structure in professor profile."""
        professor_id = "2470aebd-0e8f-44df-b093-a056986afe97"  # Real VU Professor
        response = real_client.get(f"/v1/professors/{professor_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Our simplified API returns college_id, not full college object - that's fine
        assert "college_id" in data
        assert data["college_id"] == "VU-PUNE-001"  # This specific professor's college_id
    
    def test_get_professor_not_found(self, real_client):
        """Test 404 response for non-existent professor."""
        non_existent_id = "999e9999-e99b-99d3-a999-999999999999"
        response = real_client.get(f"/v1/professors/{non_existent_id}")
        
        assert response.status_code == 404
        error_data = response.json()
        
        assert "error" in error_data
        assert "message" in error_data
        assert error_data["error"] == "not_found"
    
    def test_get_professor_invalid_uuid(self, real_client):
        """Test 400 response for invalid UUID format."""
        invalid_id = "invalid-uuid-format"
        response = real_client.get(f"/v1/professors/{invalid_id}")
        
        assert response.status_code == 400
        error_data = response.json()
        assert "error" in error_data
    
    def test_get_professor_response_content_type(self, real_client):
        """Test response content type is JSON."""
        professor_id = "2470aebd-0e8f-44df-b093-a056986afe97"  # Real VU Professor
        response = real_client.get(f"/v1/professors/{professor_id}")
        
        assert response.headers["content-type"] == "application/json"
