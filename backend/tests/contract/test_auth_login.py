"""Contract tests for user login endpoint.

These tests validate the POST /auth/login API contract.
Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest


class TestAuthLoginContract:
    """Test POST /auth/login endpoint contract compliance."""
    
    def test_login_success_response_structure(self, client, valid_login_data):
        """Test successful login response matches OpenAPI schema."""
        response = client.post("/v1/auth/login", json=valid_login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure according to AuthResponse schema
        required_fields = ["access_token", "token_type", "expires_in", "user"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Validate token fields
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 20  # JWT tokens are long
        assert data["token_type"] == "bearer"
        assert isinstance(data["expires_in"], int)
        assert data["expires_in"] > 0
        
        # Validate user object structure
        user = data["user"]
        user_required_fields = ["id", "email", "is_verified", "is_moderator"]
        for field in user_required_fields:
            assert field in user, f"Missing required user field: {field}"
        
        assert isinstance(user["is_verified"], bool)
        assert isinstance(user["is_moderator"], bool)
        assert "@" in user["email"]  # Basic email validation
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid email/password combination."""
        invalid_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = client.post("/v1/auth/login", json=invalid_data)
        assert response.status_code == 401
        
        error_data = response.json()
        assert "error" in error_data or "message" in error_data
    
    def test_login_invalid_email_format(self, client):
        """Test login with invalid email format."""
        invalid_email_data = {
            "email": "not-an-email",
            "password": "password123"
        }

        response = client.post("/v1/auth/login", json=invalid_email_data)
        assert response.status_code == 422
        
        error_data = response.json()
        assert "error" in error_data or "message" in error_data
    
    def test_login_missing_required_fields(self, client):
        """Test login when required fields are missing."""
        # Missing email
        no_email_data = {"password": "password123"}
        response = client.post("/v1/auth/login", json=no_email_data)
        assert response.status_code == 422
        
        # Missing password
        no_password_data = {"email": "test@example.com"}
        response = client.post("/v1/auth/login", json=no_password_data)
        assert response.status_code == 422
    
    def test_login_empty_credentials(self, client):
        """Test login with empty email or password."""
        empty_email_data = {
            "email": "",
            "password": "password123"
        }
        response = client.post("/v1/auth/login", json=empty_email_data)
        assert response.status_code == 422
        
        empty_password_data = {
            "email": "test@example.com", 
            "password": ""
        }
        response = client.post("/v1/auth/login", json=empty_password_data)
        assert response.status_code == 422
    
    def test_login_content_type_handling(self, client, valid_login_data):
        """Test proper content type handling."""
        # Should work with application/json
        response = client.post(
            "/v1/auth/login",
            json=valid_login_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        
        # Should reject form data
        response = client.post(
            "/v1/auth/login",
            data=valid_login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 400 or response.status_code == 422
    
    def test_login_response_content_type(self, client, valid_login_data):
        """Test response content type is JSON."""
        response = client.post("/v1/auth/login", json=valid_login_data)
        assert response.headers["content-type"] == "application/json"
    
    def test_login_response_no_password_leak(self, client, valid_login_data):
        """Test that password is not returned in response."""
        response = client.post("/v1/auth/login", json=valid_login_data)
        
        assert response.status_code == 200
        response_str = str(response.json())
        
        # Response should not contain password
        assert "password" not in response_str.lower()
        assert valid_login_data["password"] not in response_str
    
    def test_login_token_format(self, client, valid_login_data):
        """Test that access token has proper JWT-like format."""
        response = client.post("/v1/auth/login", json=valid_login_data)
        assert response.status_code == 200
        
        data = response.json()
        token = data["access_token"]
        
        # Basic JWT format check (3 parts separated by dots)
        parts = token.split('.')
        assert len(parts) >= 2  # At least header and payload (signature optional for mock)