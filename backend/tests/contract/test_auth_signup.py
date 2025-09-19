"""Contract tests for user signup endpoint.

These tests validate the POST /auth/signup API contract.
Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest
import uuid


class TestAuthSignupContract:
    """Test POST /auth/signup endpoint contract compliance."""
    
    def test_signup_success_response_structure(self, client, valid_signup_data):
        """Test successful signup response matches OpenAPI schema."""
        response = client.post("/v1/auth/signup", json=valid_signup_data)
        
        assert response.status_code == 201
        data = response.json()
        
        # Validate response structure
        required_fields = ["message", "user_id"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Validate message content
        assert "verification" in data["message"].lower()
        assert "email" in data["message"].lower()
        
        # Validate user_id is UUID format
        uuid.UUID(data["user_id"])  # Should not raise exception
    
    def test_signup_minimal_required_fields(self, client, minimal_signup_data):
        """Test signup with only required fields (email, password)."""
        response = client.post("/v1/auth/signup", json=minimal_signup_data)
        
        assert response.status_code == 201
        data = response.json()
        
        # Should succeed with minimal fields
        assert "user_id" in data
        assert "message" in data
        
        # Test with another minimal data set to confirm it works consistently
        minimal_data2 = {
            "email": "minimal2@example.com",
            "password": "password123"
        }
        
        response = client.post("/v1/auth/signup", json=minimal_data2)
        assert response.status_code == 201
        
        data = response.json()
        assert "user_id" in data
        assert "message" in data
    
    def test_signup_email_validation(self, client):
        """Test email format validation."""
        invalid_email_data = {
            "email": "invalid-email-format",
            "password": "password123"
        }
        
        response = client.post("/v1/auth/signup", json=invalid_email_data)
        assert response.status_code == 422
        
        error_data = response.json()
        assert error_data["error"] == "validation_error"
        assert "email" in error_data["message"].lower()
    
    def test_signup_password_validation(self, client):
        """Test password strength validation."""
        # Password too short
        weak_password_data = {
            "email": "test@example.com",
            "password": "123"  # Less than 8 characters
        }
        
        response = client.post("/v1/auth/signup", json=weak_password_data)
        assert response.status_code == 422
        
        error_data = response.json()
        assert "password" in error_data["message"].lower()
    
    def test_signup_duplicate_email(self, client, valid_signup_data):
        """Test handling of duplicate email addresses."""
        # First signup should succeed
        response1 = client.post("/v1/auth/signup", json=valid_signup_data)
        assert response1.status_code == 201
        
        # Second signup with same email should fail
        response2 = client.post("/v1/auth/signup", json=valid_signup_data)
        assert response2.status_code == 409
        
        error_data = response2.json()
        assert "email" in error_data["error"].lower()
        assert "exists" in error_data["error"].lower()
    
    def test_signup_missing_required_fields(self, client):
        """Test validation when required fields are missing."""
        # Missing email
        no_email_data = {"password": "password123"}
        response = client.post("/v1/auth/signup", json=no_email_data)
        assert response.status_code == 422
        
        # Missing password
        no_password_data = {"email": "test@example.com"}
        response = client.post("/v1/auth/signup", json=no_password_data)
        assert response.status_code == 422
    
    def test_signup_name_length_validation(self, client):
        """Test name field length validation."""
        long_name_data = {
            "email": "test@example.com",
            "password": "password123",
            "name": "a" * 101  # Over 100 character limit
        }
        
        response = client.post("/v1/auth/signup", json=long_name_data)
        assert response.status_code == 422
        
        error_data = response.json()
        assert "name" in error_data["message"].lower()
    
    def test_signup_invalid_college_id(self, client):
        """Test handling of invalid college ID."""
        invalid_college_data = {
            "email": "test@example.com",
            "password": "password123",
            "college_id": "invalid-uuid-format"
        }
        
        response = client.post("/v1/auth/signup", json=invalid_college_data)
        assert response.status_code == 422
        
        error_data = response.json()
        assert "college" in error_data["message"].lower()
    
    def test_signup_response_no_password_leak(self, client, valid_signup_data):
        """Test that password is not returned in response."""
        response = client.post("/v1/auth/signup", json=valid_signup_data)
        
        assert response.status_code == 201
        data = response.json()
        
        # Response should not contain password or password_hash
        response_str = str(data)
        assert "password" not in response_str.lower()
        assert valid_signup_data["password"] not in response_str
    
    def test_signup_content_type_handling(self, client, valid_signup_data):
        """Test proper content type handling."""
        # Should work with application/json
        response = client.post(
            "/v1/auth/signup", 
            json=valid_signup_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 201
        
        # Should reject other content types
        response = client.post(
            "/v1/auth/signup",
            data=valid_signup_data,  # form data instead of JSON
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 422
    
    def test_signup_response_content_type(self, client, valid_signup_data):
        """Test response content type is JSON."""
        response = client.post("/v1/auth/signup", json=valid_signup_data)
        assert response.headers["content-type"] == "application/json"
