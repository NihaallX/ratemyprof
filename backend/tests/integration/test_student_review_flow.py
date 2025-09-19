"""Integration test for student discovery and review flow.

This test validates the complete user scenario from quickstart.md:
Student discovers professor, views profile, and submits review.

Tests MUST fail initially (RED phase) before implementation exists.
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestStudentReviewFlow:
    """Test complete student discovery and review workflow."""
    
    @pytest.fixture
    def client(self):
        """FastAPI test client - will fail until main app exists."""
        from src.main import app  # Import will fail until app exists
        return TestClient(app)
    
    @pytest.fixture
    async def db_session(self):
        """Database session for integration testing."""
        # This will fail until database setup exists
        from src.lib.database import get_async_session
        async with get_async_session() as session:
            yield session
    
    @pytest.fixture
    def test_student_data(self):
        """Test student registration data."""
        return {
            "email": "test.student@example.com",
            "password": "securepassword123",
            "name": "Test Student",
        }
    
    @pytest.fixture
    def test_college_data(self):
        """Test college data for seeding."""
        return {
            "name": "Test University",
            "city": "Delhi",
            "state": "Delhi",
            "college_type": "university"
        }
    
    @pytest.fixture
    def test_professor_data(self):
        """Test professor data for seeding."""
        return {
            "first_name": "Dr. Rajesh",
            "last_name": "Sharma",
            "known_as": "Dr. Sharma",
            "department": "Computer Science",
            "subjects_taught": ["Data Structures", "Algorithms", "Database Systems"]
        }
    
    async def test_complete_student_review_workflow(
        self, client, db_session, test_student_data, test_college_data, test_professor_data
    ):
        """Test the complete workflow from quickstart Scenario 1."""
        
        # Step 1: Setup test data (college and professor)
        # This will fail until models exist
        from src.models.college import College
        from src.models.professor import Professor
        
        college = College(**test_college_data)
        db_session.add(college)
        await db_session.commit()
        await db_session.refresh(college)
        
        professor_data = test_professor_data.copy()
        professor_data["college_id"] = college.id
        professor = Professor(**professor_data)
        db_session.add(professor)
        await db_session.commit()
        await db_session.refresh(professor)
        
        # Step 2: Student registers account
        signup_response = client.post("/v1/auth/signup", json=test_student_data)
        assert signup_response.status_code == 201
        student_id = signup_response.json()["user_id"]
        
        # Step 3: Student logs in
        login_response = client.post("/v1/auth/login", json={
            "email": test_student_data["email"],
            "password": test_student_data["password"]
        })
        assert login_response.status_code == 200
        
        auth_token = login_response.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Step 4: Student searches for professor
        search_response = client.get("/v1/professors", params={
            "q": "Dr. Sharma Computer Science"
        })
        assert search_response.status_code == 200
        
        search_data = search_response.json()
        assert search_data["total"] > 0
        
        # Find our test professor in results
        found_professor = None
        for prof in search_data["professors"]:
            if prof["id"] == str(professor.id):
                found_professor = prof
                break
        
        assert found_professor is not None, "Professor not found in search results"
        assert found_professor["first_name"] == "Dr. Rajesh"
        assert found_professor["last_name"] == "Sharma"
        
        # Step 5: Student views professor profile
        profile_response = client.get(f"/v1/professors/{professor.id}")
        assert profile_response.status_code == 200
        
        profile_data = profile_response.json()
        assert profile_data["first_name"] == "Dr. Rajesh"
        assert profile_data["department"] == "Computer Science"
        assert profile_data["college"]["name"] == "Test University"
        
        # Initially no reviews
        assert profile_data["total_reviews"] == 0
        assert len(profile_data["reviews"]) == 0
        
        # Step 6: Student submits review
        review_data = {
            "professor_id": str(professor.id),
            "ratings": {
                "clarity": 5,
                "helpfulness": 4,
                "workload": 3,
                "engagement": 5
            },
            "review_text": "Excellent professor! Explains concepts very clearly and is always available for help. The workload is reasonable and manageable.",
            "semester_taken": "Fall 2024",
            "course_taken": "Data Structures and Algorithms",
            "anonymous": False
        }
        
        review_response = client.post("/v1/reviews", json=review_data, headers=auth_headers)
        assert review_response.status_code == 201
        
        review_result = review_response.json()
        assert review_result["professor_id"] == str(professor.id)
        assert review_result["ratings"]["clarity"] == 5
        assert review_result["author_name"] == test_student_data["name"]
        
        # Step 7: Verify review appears on professor profile
        updated_profile_response = client.get(f"/v1/professors/{professor.id}")
        assert updated_profile_response.status_code == 200
        
        updated_profile = updated_profile_response.json()
        assert updated_profile["total_reviews"] == 1
        assert len(updated_profile["reviews"]) == 1
        
        # Verify aggregate ratings updated
        avg_ratings = updated_profile["avg_ratings"]
        assert avg_ratings["clarity"] == 5.0
        assert avg_ratings["helpfulness"] == 4.0
        assert avg_ratings["workload"] == 3.0
        assert avg_ratings["engagement"] == 5.0
        assert avg_ratings["overall"] == 4.25  # Average of all ratings
        
        # Step 8: Verify review content
        review_in_profile = updated_profile["reviews"][0]
        assert review_in_profile["review_text"] == review_data["review_text"]
        assert review_in_profile["semester_taken"] == "Fall 2024"
        assert review_in_profile["course_taken"] == "Data Structures and Algorithms"
        assert review_in_profile["is_flagged"] is False
        assert review_in_profile["flags_count"] == 0
    
    async def test_anonymous_review_workflow(
        self, client, db_session, test_student_data, test_college_data, test_professor_data
    ):
        """Test anonymous review submission workflow."""
        
        # Setup (similar to above test)
        from src.models.college import College
        from src.models.professor import Professor
        
        college = College(**test_college_data)
        db_session.add(college)
        await db_session.commit()
        await db_session.refresh(college)
        
        professor_data = test_professor_data.copy()
        professor_data["college_id"] = college.id
        professor = Professor(**professor_data)
        db_session.add(professor)
        await db_session.commit()
        
        # Student registers and logs in
        client.post("/v1/auth/signup", json=test_student_data)
        login_response = client.post("/v1/auth/login", json={
            "email": test_student_data["email"],
            "password": test_student_data["password"]
        })
        
        auth_token = login_response.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Submit anonymous review
        anonymous_review_data = {
            "professor_id": str(professor.id),
            "ratings": {
                "clarity": 4,
                "helpfulness": 5,
                "workload": 2,
                "engagement": 4
            },
            "review_text": "Good professor but gives a lot of assignments.",
            "anonymous": True,
            "anon_display_name": "CS Senior 2024"
        }
        
        review_response = client.post("/v1/reviews", json=anonymous_review_data, headers=auth_headers)
        assert review_response.status_code == 201
        
        review_result = review_response.json()
        assert review_result["author_name"] == "CS Senior 2024"
        
        # Verify anonymous review appears correctly in profile
        profile_response = client.get(f"/v1/professors/{professor.id}")
        profile_data = profile_response.json()
        
        anonymous_review = profile_data["reviews"][0]
        assert anonymous_review["author_name"] == "CS Senior 2024"
        assert anonymous_review["review_text"] == anonymous_review_data["review_text"]
    
    def test_search_across_multiple_colleges(self, client):
        """Test cross-college professor search functionality."""
        # This test verifies quickstart Scenario 4: Multi-College Professor Search
        
        # Search for professors in a specific state
        response = client.get("/v1/professors", params={
            "state": "Maharashtra",
            "q": "Computer Science"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return professors from multiple colleges in Maharashtra
        if data["professors"]:
            colleges_found = set()
            for professor in data["professors"]:
                colleges_found.add(professor["college"]["name"])
                assert professor["college"]["state"] == "Maharashtra"
            
            # If multiple professors found, should be from different colleges
            # (This will be true once we have real data)
    
    def test_review_duplicate_prevention(self, client, test_student_data):
        """Test that users cannot submit multiple reviews for same professor."""
        
        # Register and login
        client.post("/v1/auth/signup", json=test_student_data)
        login_response = client.post("/v1/auth/login", json={
            "email": test_student_data["email"],
            "password": test_student_data["password"]
        })
        
        auth_token = login_response.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {auth_token}"}
        
        professor_id = "123e4567-e89b-12d3-a456-426614174000"
        review_data = {
            "professor_id": professor_id,
            "ratings": {
                "clarity": 4,
                "helpfulness": 4,
                "workload": 4,
                "engagement": 4
            },
            "review_text": "Good professor overall."
        }
        
        # First review should succeed
        response1 = client.post("/v1/reviews", json=review_data, headers=auth_headers)
        assert response1.status_code == 201
        
        # Second review for same professor should fail
        response2 = client.post("/v1/reviews", json=review_data, headers=auth_headers)
        assert response2.status_code == 409
        
        error_data = response2.json()
        assert "already reviewed" in error_data["message"].lower()
