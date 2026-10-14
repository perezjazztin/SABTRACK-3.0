import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password, UserRole
from app.modules.areas.models import Area
from app.modules.identity.models import User

# In-memory database with static connection pool for hermetic tests
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

TEST_PASSWORD = "TestSecretPassword123!"


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Initializes schema once for the entire test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def seed_test_users():
    """Seeds test accounts before each test run."""
    db = TestingSessionLocal()
    # Clean tables
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()

    hashed = hash_password(TEST_PASSWORD)
    users = [
        User(
            email="resident@sabtrack.test",
            hashed_password=hashed,
            full_name="Test Resident",
            role=UserRole.RESIDENT,
            is_active=True,
        ),
        User(
            email="staff@sabtrack.test",
            hashed_password=hashed,
            full_name="Test Staff Reviewer",
            role=UserRole.BARANGAY_STAFF,
            is_active=True,
        ),
        User(
            email="admin@sabtrack.test",
            hashed_password=hashed,
            full_name="Test Administrator",
            role=UserRole.BARANGAY_ADMIN,
            is_active=True,
        ),
        User(
            email="maintainer@sabtrack.test",
            hashed_password=hashed,
            full_name="Test System Maintainer",
            role=UserRole.SYSTEM_MAINTAINER,
            is_active=True,
        ),
    ]
    db.add_all(users)
    db.commit()
    db.close()


@pytest.fixture
def db_session():
    """Yields a test database session."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """Provides a test client configured to use the test database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
