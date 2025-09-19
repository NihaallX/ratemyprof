"""Contract tests for auth verify endpoint.

These tests validate the POST /auth/verify API contract.
Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest
from fastapi.testclient import TestClient


class TestAuthVerifyContract:
    """Test POST /auth/verify endpoint contract compliance."""
    
    @pytest.fixture
    def client(self, mock_supabase):
        """FastAPI test client with mocked Supabase."""
        from src.main import app
        from src.lib.database import get_supabase
        
        # Override the dependency with our mock
        app.dependency_overrides[get_supabase] = lambda: mock_supabase
        client = TestClient(app)
        
        yield client
        
        # Clean up
        app.dependency_overrides.clear()
    
    @pytest.fixture
    def valid_verify_data(self):
        """Valid email verification data per OpenAPI schema."""
        return {
            "email": "31230730@vupune.ac.in",  # Vishwakarma University email with SRN format
            "otp_code": "123456"
        }
    
    def test_verify_email_success(self, client, valid_verify_data):
        """Test successful email verification."""
        response = client.post("/v1/auth/verify", json=valid_verify_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "message" in data
        assert isinstance(data["message"], str)
        assert "verified" in data["message"].lower()
    
    def test_verify_email_invalid_otp(self, client):
        """Test verification with invalid OTP code."""
        invalid_data = {
            "email": "31230730@vupune.ac.in",
            "otp_code": "000000"
        }
        
        response = client.post("/v1/auth/verify", json=invalid_data)
        assert response.status_code == 401
        
        data = response.json()
        assert "error" in data
        assert "invalid" in data["error"].lower() or "expired" in data["error"].lower()
    
    def test_verify_email_missing_fields(self, client):
        """Test verification with missing required fields."""
        # Missing email
        response = client.post("/v1/auth/verify", json={"otp_code": "123456"})
        assert response.status_code == 422
        
        # Missing OTP code
        response = client.post("/v1/auth/verify", json={"email": "31230730@vupune.ac.in"})
        assert response.status_code == 422
        
        # Empty request
        response = client.post("/v1/auth/verify", json={})
        assert response.status_code == 422
    
    def test_verify_email_invalid_format(self, client):
        """Test verification with invalid email format."""
        invalid_data = {
            "email": "not-an-email",
            "otp_code": "123456"
        }
        
        response = client.post("/v1/auth/verify", json=invalid_data)
        assert response.status_code == 422
    
    def test_verify_email_invalid_otp_format(self, client):
        """Test verification with invalid OTP format."""
        # OTP too short
        response = client.post("/v1/auth/verify", json={
            "email": "31230730@vupune.ac.in",
            "otp_code": "123"
        })
        assert response.status_code == 422
        
        # OTP too long
        response = client.post("/v1/auth/verify", json={
            "email": "31230730@vupune.ac.in", 
            "otp_code": "1234567"
        })
        assert response.status_code == 422
        
        # OTP with letters
        response = client.post("/v1/auth/verify", json={
            "email": "31230730@vupune.ac.in",
            "otp_code": "12345a"
        })
        assert response.status_code == 422
    
    def test_verify_email_content_type(self, client, valid_verify_data):
        """Test that endpoint requires JSON content type."""
        # Send as form data instead of JSON
        response = client.post("/v1/auth/verify", data=valid_verify_data)
        assert response.status_code in [400, 422, 415]  # Bad request or unsupported media type
    
    def test_verify_email_expired_code(self, client):
        """Test verification with expired OTP code."""
        expired_data = {
            "email": "31230730@vupune.ac.in",
            "otp_code": "999999"  # Simulate expired code
        }
        
        response = client.post("/v1/auth/verify", json=expired_data)
        assert response.status_code == 401
        
        data = response.json()
        assert "error" in data