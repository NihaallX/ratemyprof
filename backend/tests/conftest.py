"""Test configuration and shared fixtures for RateMyProf backend tests."""
import pytest
import asyncio
from fastapi.testclient import TestClient
from supabase import Client
from unittest.mock import Mock

# Test configuration - Using Vishwakarma University format
TEST_USER_EMAIL = "31230350@vupune.ac.in"  # VU student email format (SRN@vupune.ac.in)
TEST_USER_PASSWORD = "testpassword123"
TEST_USER_NAME = "Test Student"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing without real database calls."""
    mock_client = Mock(spec=Client)
    mock_auth = Mock()
    mock_client.auth = mock_auth
    
    # Track emails that have been signed up to simulate duplicates
    signed_up_emails = set()
    
    # Mock VU database data
    VU_COLLEGES_DATA = [
        {
            "id": "VU-PUNE-001",
            "name": "Vishwakarma University",
            "city": "Pune", 
            "state": "Maharashtra",
            "college_type": "university",  # Standardized to enum value
            "established_year": 2017,
            "website": "https://vu.edu.in",
            "total_professors": 45
        },
        {
            "id": "vit123456", 
            "name": "VIT Pune (Vishwakarma Institute of Technology)",
            "city": "Pune",
            "state": "Maharashtra", 
            "college_type": "Private Institute",
            "established_year": 1983,
            "website": "https://vit.edu",
            "total_professors": 120
        },
        {
            "id": "iitb001",
            "name": "Indian Institute of Technology Bombay",
            "city": "Mumbai",
            "state": "Maharashtra",
            "college_type": "Public Institute",
            "established_year": 1958,
            "website": "https://iitb.ac.in",
            "total_professors": 650
        }
    ]
    
    VU_PROFESSORS_DATA = [
        {
            "id": "prof001",
            "name": "Dr. Rajesh Kumar",
            "college_id": "VU-PUNE-001",
            "department": "Computer Science",
            "average_rating": 4.2,
            "total_reviews": 15,
            "designation": "Associate Professor",
            "subjects": ["Data Structures", "Algorithms", "Web Development"]
        },
        {
            "id": "prof002", 
            "name": "Prof. Priya Sharma",
            "college_id": "VU-PUNE-001",
            "department": "Computer Science", 
            "average_rating": 3.8,
            "total_reviews": 8,
            "designation": "Assistant Professor",
            "subjects": ["Database Systems", "Software Engineering"]
        }
    ]
    
    def mock_sign_up(data):
        email = data.get("email", "")
        if email in signed_up_emails:
            raise Exception("User already registered")
        
        signed_up_emails.add(email)
        return Mock(
            user=Mock(id="123e4567-e89b-12d3-a456-426614174000", email=email),
            session=None
        )
    
    mock_auth.sign_up.side_effect = mock_sign_up
    
    # Mock login with conditional responses
    def mock_sign_in_with_password(data):
        email = data.get("email", "")
        password = data.get("password", "")
        
        # Handle empty credentials
        if not email or not password:
            raise Exception("Invalid login credentials")
        
        # Only allow valid test credentials
        if email == TEST_USER_EMAIL and password == TEST_USER_PASSWORD:
            return Mock(
                user=Mock(
                    id="test-user-id", 
                    email=TEST_USER_EMAIL,
                    email_confirmed_at="2023-01-01T00:00:00Z",
                    created_at="2023-01-01T00:00:00Z", 
                    updated_at="2023-01-01T00:00:00Z",
                    user_metadata={"name": TEST_USER_NAME}
                ),
                session=Mock(
                    access_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                    refresh_token="mock-refresh-token",
                    expires_in=3600
                )
            )
        else:
            # Invalid credentials
            raise Exception("Invalid login credentials")
    
    mock_auth.sign_in_with_password.side_effect = mock_sign_in_with_password
    
    # Mock OTP verification
    def mock_verify_otp(data):
        email = data.get("email", "")
        token = data.get("token", "")
        
        # Valid OTP is 123456 for any email
        if token == "123456":
            return Mock(
                user=Mock(
                    id="verified-user-id",
                    email=email,
                    email_confirmed_at="2023-01-01T00:00:00Z"
                ),
                session=Mock(
                    access_token="verification-token",
                    refresh_token="verification-refresh"
                )
            )
        else:
            # Invalid or expired OTP
            if token == "000000":
                raise Exception("Invalid verification code")
            elif token == "999999": 
                raise Exception("Token has expired")
            else:
                raise Exception("Invalid verification code")
    
    mock_auth.verify_otp.side_effect = mock_verify_otp
    
    # Mock JWT token authentication
    def mock_get_user(token):
        # Mock successful user response for test tokens
        if "test-jwt-token" in token or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" in token:
            import uuid
            test_user_id = str(uuid.uuid4())  # Generate unique ID for each call
            return Mock(
                user=Mock(
                    id=test_user_id,
                    email="31230350@vupune.ac.in",  # VU test email
                    email_confirmed_at="2024-01-01T00:00:00Z",
                    created_at="2024-01-01T00:00:00Z", 
                    updated_at="2024-01-01T00:00:00Z",
                    user_metadata={},
                    app_metadata={}
                )
            )
        else:
            return Mock(user=None)
    
    def mock_set_session(access_token, refresh_token):
        # Mock set session - just return success
        return True
        
    mock_auth.get_user = mock_get_user
    mock_auth.set_session = mock_set_session
    
    # Mock table operations
    def mock_table(table_name):
        mock_table_client = Mock()
        
        if table_name == 'colleges':
            mock_table_client.select.return_value = mock_table_client
            mock_table_client.ilike.return_value = mock_table_client
            mock_table_client.order.return_value = mock_table_client
            mock_table_client.limit.return_value = mock_table_client
            
            def mock_execute():
                return Mock(data=VU_COLLEGES_DATA, count=len(VU_COLLEGES_DATA))
            
            mock_table_client.execute = mock_execute
            
        elif table_name == 'professors':
            mock_table_client.select.return_value = mock_table_client
            mock_table_client.eq.return_value = mock_table_client
            mock_table_client.ilike.return_value = mock_table_client
            mock_table_client.order.return_value = mock_table_client
            mock_table_client.limit.return_value = mock_table_client
            mock_table_client.single.return_value = mock_table_client
            
            def mock_execute():
                return Mock(data=VU_PROFESSORS_DATA, count=len(VU_PROFESSORS_DATA))
            
            def mock_execute_single():
                # For single professor lookup, return the first professor
                return Mock(data=VU_PROFESSORS_DATA[0] if VU_PROFESSORS_DATA else None)
            
            mock_table_client.execute = mock_execute
            # When .single() is called, use the single result method
            mock_table_client.single.return_value.execute = mock_execute_single
            
        # Skip mocking for reviews table - use real database for reviews
        # elif table_name == 'reviews':
            
        return mock_table_client
    
    mock_client.table = mock_table
    
    return mock_client


@pytest.fixture  
def client():
    """FastAPI test client with real Supabase database."""
    from src.main import app
    
    # Use the real app with real database - no mocking
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture  
def real_client():
    """FastAPI test client with real Supabase database - no mocking."""
    from src.main import app
    
    # Use the real app with real database - no overrides
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def valid_signup_data():
    """Valid signup request data for testing - Vishwakarma University student."""
    return {
        "email": "31230351@vupune.ac.in",  # VU student email format
        "password": "securepassword123",
        "name": "Test Student",
        "college_id": "VU-PUNE-001"  # Proper VU college ID
    }


@pytest.fixture
def minimal_signup_data():
    """Minimal signup request data with only required fields - VU student."""
    return {
        "email": "31230352@vupune.ac.in",  # VU student email format
        "password": "password123"
    }


@pytest.fixture
def valid_login_data():
    """Valid login request data for testing."""
    return {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }


@pytest.fixture 
def indian_college_id_samples():
    """Sample Indian college ID formats for testing."""
    return {
        "prn_vu": "312303501027",  # Vishwakarma University PRN
        "prn_pune": "220340520001",  # Pune University PRN  
        "du_format": "DU/2023/CSE/001",  # Delhi University
        "iit_format": "IITB/2023/12345",  # IIT Bombay
        "state_format": "MH/VU/2023/CSE001",  # Maharashtra format
        "aicte_format": "23CSE1234567",  # AICTE format
        "generic": "VU2023CSE001",  # Generic college code
        "legacy_uuid": "123e4567-e89b-12d3-a456-426614174000"  # Backward compatibility
    }


@pytest.fixture
def auth_headers():
    """Authentication headers for testing protected endpoints."""
    return {
        "Authorization": "Bearer test-jwt-token",  # Simple test token that our mock handles
        "Content-Type": "application/json"
    }