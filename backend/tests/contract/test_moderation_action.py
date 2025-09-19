"""Contract tests for moderation action endpoint.

These tests validate the POST /moderation/reviews/{review_id}/action API contract.
Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest
from fastapi.testclient import TestClient


class TestModerationActionContract:
    """Test POST /moderation/reviews/{review_id}/action endpoint contract compliance."""
    
    @pytest.fixture
    def valid_moderation_data(self):
        """Valid moderation action data per OpenAPI schema."""
        return {
            "action": "approve",
            "reason": "Review follows guidelines and provides constructive feedback"
        }
    
    @pytest.fixture
    def auth_headers(self):
        """Authentication headers for moderator user."""
        return {"Authorization": "Bearer test-jwt-token"}
    
    def test_moderate_review_approve_success(self, client, valid_moderation_data, auth_headers):
        """Test successful review approval by moderator."""
        review_id = "123e4567-e89b-12d3-a456-426614174000"
        
        response = client.post(
            f"/v1/moderation/reviews/{review_id}/action",
            json=valid_moderation_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure per OpenAPI spec
        assert "action_taken" in data
        assert "review_id" in data
        assert "moderator_notes" in data
        assert "timestamp" in data
        
        # Validate response values
        assert data["action_taken"] == "approve"
        assert data["review_id"] == review_id
    
    def test_moderate_review_remove_success(self, client, auth_headers):
        """Test successful review removal by moderator."""
        review_id = "123e4567-e89b-12d3-a456-426614174001"
        removal_data = {
            "action": "remove",
            "reason": "Contains inappropriate content violating community guidelines"
        }
        
        response = client.post(
            f"/v1/moderation/reviews/{review_id}/action",
            json=removal_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["action_taken"] == "remove"
        assert data["review_id"] == review_id
    
    def test_moderate_review_unauthorized(self, client, valid_moderation_data):
        """Test moderation without authentication returns 401."""
        review_id = "123e4567-e89b-12d3-a456-426614174000"
        
        response = client.post(
            f"/v1/moderation/reviews/{review_id}/action",
            json=valid_moderation_data
        )
        
        assert response.status_code == 401
        error_data = response.json()
        assert "error" in error_data
    
    def test_moderate_review_forbidden(self, client, valid_moderation_data):
        """Test moderation with non-moderator account returns 403."""
        review_id = "123e4567-e89b-12d3-a456-426614174000"
        regular_user_headers = {"Authorization": "Bearer regular-user-token"}
        
        response = client.post(
            f"/v1/moderation/reviews/{review_id}/action",
            json=valid_moderation_data,
            headers=regular_user_headers
        )
        
        assert response.status_code == 403
        error_data = response.json()
        assert "error" in error_data
    
    def test_moderate_review_not_found(self, client, valid_moderation_data, auth_headers):
        """Test moderation of non-existent review returns 404."""
        non_existent_review_id = "999e9999-e99b-99d9-a999-999999999999"
        
        response = client.post(
            f"/v1/moderation/reviews/{non_existent_review_id}/action",
            json=valid_moderation_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        error_data = response.json()
        assert "error" in error_data
    
    def test_moderate_review_invalid_uuid(self, client, valid_moderation_data, auth_headers):
        """Test moderation with invalid UUID format returns 422."""
        invalid_id = "not-a-valid-uuid"
        
        response = client.post(
            f"/v1/moderation/reviews/{invalid_id}/action",
            json=valid_moderation_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        error_data = response.json()
        assert "error" in error_data
    
    def test_moderate_review_missing_action(self, client, auth_headers):
        """Test moderation without action field returns 422."""
        review_id = "123e4567-e89b-12d3-a456-426614174000"
        incomplete_data = {"reason": "Missing action field"}
        
        response = client.post(
            f"/v1/moderation/reviews/{review_id}/action",
            json=incomplete_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        error_data = response.json()
        assert "error" in error_data
    
    def test_moderate_review_invalid_action(self, client, auth_headers):
        """Test moderation with invalid action returns 422."""
        review_id = "123e4567-e89b-12d3-a456-426614174000"
        invalid_data = {
            "action": "invalid_action_type",
            "reason": "Testing invalid action"
        }
        
        response = client.post(
            f"/v1/moderation/reviews/{review_id}/action",
            json=invalid_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        error_data = response.json()
        assert "error" in error_data
    
    def test_moderate_review_valid_actions(self, client, auth_headers):
        """Test all valid moderation actions."""
        review_id = "123e4567-e89b-12d3-a456-426614174000"
        valid_actions = ["approve", "remove", "edit", "flag"]
        
        for action in valid_actions:
            moderation_data = {
                "action": action,
                "reason": f"Testing {action} action"
            }
            
            response = client.post(
                f"/v1/moderation/reviews/{review_id}/action",
                json=moderation_data,
                headers=auth_headers
            )
            
            # Should be 200 (success) or 404 (review not found), but not 422 (validation error)
            assert response.status_code in [200, 404]
    
    def test_moderate_review_missing_reason(self, client, auth_headers):
        """Test moderation without reason field returns 422."""
        review_id = "123e4567-e89b-12d3-a456-426614174000"
        incomplete_data = {"action": "remove"}
        
        response = client.post(
            f"/v1/moderation/reviews/{review_id}/action",
            json=incomplete_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        error_data = response.json()
        assert "error" in error_data
    
    def test_moderate_review_empty_reason(self, client, auth_headers):
        """Test moderation with empty reason returns 422."""
        review_id = "123e4567-e89b-12d3-a456-426614174000"
        empty_reason_data = {
            "action": "remove",
            "reason": ""
        }
        
        response = client.post(
            f"/v1/moderation/reviews/{review_id}/action",
            json=empty_reason_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        error_data = response.json()
        assert "error" in error_data
    
    def test_moderate_review_long_reason(self, client, auth_headers):
        """Test moderation with excessively long reason."""
        review_id = "123e4567-e89b-12d3-a456-426614174000"
        long_reason_data = {
            "action": "remove",
            "reason": "x" * 1001  # Assuming 1000 char limit
        }
        
        response = client.post(
            f"/v1/moderation/reviews/{review_id}/action",
            json=long_reason_data,
            headers=auth_headers
        )
        
        # Should accept (200), not found (404), or reject for length (422)
        assert response.status_code in [200, 404, 422]
    
    def test_moderate_review_content_type(self, client, valid_moderation_data, auth_headers):
        """Test proper content type handling for moderation requests."""
        review_id = "123e4567-e89b-12d3-a456-426614174000"
        
        # Should reject non-JSON content
        response = client.post(
            f"/v1/moderation/reviews/{review_id}/action",
            data=valid_moderation_data,  # Form data instead of JSON
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code in [400, 422, 415]  # Bad Request, Validation Error, or Unsupported Media Type