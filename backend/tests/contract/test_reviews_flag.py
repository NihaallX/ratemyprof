"""Contract tests for review flagging endpoint.

These tests validate the POST /reviews/{review_id}/flag API contract.
Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest
from fastapi.testclient import TestClient


class TestReviewsFlagContract:
    """Test POST /reviews/{review_id}/flag endpoint contract compliance."""
    
    @pytest.fixture
    def valid_flag_data(self):
        """Valid flag data per OpenAPI schema."""
        return {
            "reason": "inappropriate_content",
            "description": "This review contains inappropriate language and personal attacks."
        }
    
    @pytest.fixture
    def auth_headers(self):
        """Authentication headers for authenticated requests."""
        return {"Authorization": "Bearer test-jwt-token"}
    
    @pytest.fixture
    def sample_review_id(self):
        """Sample UUID for review ID."""
        return "123e4567-e89b-12d3-a456-426614174002"
    
    def test_flag_review_success(self, client, valid_flag_data, auth_headers, sample_review_id):
        """Test successful review flagging."""
        response = client.post(f"/v1/reviews/{sample_review_id}/flag", 
                             json=valid_flag_data, 
                             headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        
        # Validate response structure
        assert "message" in data
        assert isinstance(data["message"], str)
        assert "flagged" in data["message"].lower()
    
    def test_flag_review_unauthorized(self, client, valid_flag_data, sample_review_id):
        """Test flagging review without authentication."""
        response = client.post(f"/v1/reviews/{sample_review_id}/flag", json=valid_flag_data)
        assert response.status_code == 401
        
        data = response.json()
        assert "error" in data
        assert "unauthorized" in data["error"].lower() or "authentication" in data["error"].lower()
    
    def test_flag_review_not_found(self, client, valid_flag_data, auth_headers):
        """Test flagging non-existent review."""
        non_existent_id = "123e4567-e89b-12d3-a456-999999999999"
        
        response = client.post(f"/v1/reviews/{non_existent_id}/flag", 
                             json=valid_flag_data, 
                             headers=auth_headers)
        assert response.status_code == 404
        
        data = response.json()
        assert "error" in data
        assert "not found" in data["error"].lower()
    
    def test_flag_review_already_flagged(self, client, valid_flag_data, auth_headers, sample_review_id):
        """Test flagging review that user already flagged."""
        # First flag should succeed
        response1 = client.post(f"/v1/reviews/{sample_review_id}/flag", 
                              json=valid_flag_data, 
                              headers=auth_headers)
        # Assuming first flag succeeds or already exists
        
        # Second flag should conflict
        response2 = client.post(f"/v1/reviews/{sample_review_id}/flag", 
                              json=valid_flag_data, 
                              headers=auth_headers)
        assert response2.status_code == 409
        
        data = response2.json()
        assert "error" in data
        assert "already" in data["error"].lower()
    
    def test_flag_review_invalid_uuid(self, client, valid_flag_data, auth_headers):
        """Test flagging review with invalid UUID format."""
        invalid_id = "not-a-valid-uuid"
        
        response = client.post(f"/v1/reviews/{invalid_id}/flag", 
                             json=valid_flag_data, 
                             headers=auth_headers)
        assert response.status_code == 422
    
    def test_flag_review_missing_reason(self, client, auth_headers, sample_review_id):
        """Test flagging review without required reason field."""
        invalid_data = {
            "description": "Missing reason field"
        }
        
        response = client.post(f"/v1/reviews/{sample_review_id}/flag", 
                             json=invalid_data, 
                             headers=auth_headers)
        assert response.status_code == 422
    
    def test_flag_review_invalid_reason(self, client, auth_headers, sample_review_id):
        """Test flagging review with invalid reason."""
        invalid_data = {
            "reason": "invalid_reason_type",
            "description": "Testing invalid reason"
        }
        
        response = client.post(f"/v1/reviews/{sample_review_id}/flag", 
                             json=invalid_data, 
                             headers=auth_headers)
        assert response.status_code == 422
    
    def test_flag_review_valid_reasons(self, client, auth_headers, sample_review_id):
        """Test flagging with all valid reason types."""
        valid_reasons = [
            "inappropriate_content",
            "spam",
            "fake_review",
            "harassment",
            "off_topic",
            "other"
        ]
        
        for reason in valid_reasons:
            flag_data = {
                "reason": reason,
                "description": f"Testing {reason} flag reason"
            }
            
            # Each test should handle the case where review might already be flagged
            response = client.post(f"/v1/reviews/{sample_review_id}/flag", 
                                 json=flag_data, 
                                 headers=auth_headers)
            # Should be 201 (created) or 409 (already flagged)
            assert response.status_code in [201, 409]
    
    def test_flag_review_empty_description(self, client, auth_headers, sample_review_id):
        """Test flagging review with empty description."""
        flag_data = {
            "reason": "inappropriate_content",
            "description": ""  # Empty description might be allowed
        }
        
        response = client.post(f"/v1/reviews/{sample_review_id}/flag", 
                             json=flag_data, 
                             headers=auth_headers)
        # Depends on API design - might allow empty descriptions
        assert response.status_code in [201, 409, 422]
    
    def test_flag_review_content_type(self, client, valid_flag_data, auth_headers, sample_review_id):
        """Test that endpoint requires JSON content type."""
        # Send as form data instead of JSON
        response = client.post(f"/v1/reviews/{sample_review_id}/flag", 
                             data=valid_flag_data, 
                             headers=auth_headers)
        assert response.status_code in [400, 422, 415]  # Bad request or unsupported media type