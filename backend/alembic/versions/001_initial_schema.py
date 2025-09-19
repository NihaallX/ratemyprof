"""Initial schema for RateMyProf India

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-09-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(254), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(128), nullable=False),
        sa.Column('name', sa.String(100), nullable=True),
        sa.Column('college_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_verified', sa.Boolean, default=False, nullable=False),
        sa.Column('is_moderator', sa.Boolean, default=False, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
    )
    
    # Create colleges table
    op.create_table(
        'colleges',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('state', sa.String(50), nullable=False),
        sa.Column('college_type', sa.Enum('university', 'college', 'institute', name='college_type_enum'), nullable=False),
        sa.Column('website_url', sa.String(255), nullable=True),
        sa.Column('established_year', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Create professors table
    op.create_table(
        'professors',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('first_name', sa.String(50), nullable=False),
        sa.Column('last_name', sa.String(50), nullable=False),
        sa.Column('known_as', sa.String(50), nullable=True),
        sa.Column('college_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('department', sa.String(100), nullable=False),
        sa.Column('profile_photo_url', sa.String(255), nullable=True),
        sa.Column('subjects_taught', postgresql.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['college_id'], ['colleges.id'], ondelete='CASCADE'),
    )
    
    # Create reviews table
    op.create_table(
        'reviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('professor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('anon_display_name', sa.String(50), nullable=True),
        sa.Column('rating_clarity', sa.Integer, nullable=False),
        sa.Column('rating_helpfulness', sa.Integer, nullable=False),
        sa.Column('rating_workload', sa.Integer, nullable=False),
        sa.Column('rating_engagement', sa.Integer, nullable=False),
        sa.Column('review_text', sa.Text, nullable=True),
        sa.Column('semester_taken', sa.String(50), nullable=True),
        sa.Column('course_taken', sa.String(100), nullable=True),
        sa.Column('is_flagged', sa.Boolean, default=False, nullable=False),
        sa.Column('is_removed', sa.Boolean, default=False, nullable=False),
        sa.Column('flags_count', sa.Integer, default=0, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['professor_id'], ['professors.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.CheckConstraint('rating_clarity >= 1 AND rating_clarity <= 5', name='check_clarity_range'),
        sa.CheckConstraint('rating_helpfulness >= 1 AND rating_helpfulness <= 5', name='check_helpfulness_range'),
        sa.CheckConstraint('rating_workload >= 1 AND rating_workload <= 5', name='check_workload_range'),
        sa.CheckConstraint('rating_engagement >= 1 AND rating_engagement <= 5', name='check_engagement_range'),
    )
    
    # Create review_flags table
    op.create_table(
        'review_flags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('review_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('flagger_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reason', sa.Enum('inappropriate', 'spam', 'offensive', 'irrelevant', 'personal_attack', name='flag_reason_enum'), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['review_id'], ['reviews.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['flagger_user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Create moderation_logs table
    op.create_table(
        'moderation_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('review_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('moderator_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.Enum('approved', 'removed', 'warned', 'appealed', 'reinstated', name='moderation_action_enum'), nullable=False),
        sa.Column('reason', sa.String(200), nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['review_id'], ['reviews.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['moderator_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Add foreign key constraint for users.college_id
    op.create_foreign_key(
        'fk_users_college_id',
        'users', 'colleges',
        ['college_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Create indexes for performance
    op.create_index('idx_users_email', 'users', ['email'], unique=True)
    op.create_index('idx_colleges_state_city', 'colleges', ['state', 'city'])
    op.create_index('idx_professors_college_dept', 'professors', ['college_id', 'department'])
    op.create_index('idx_professors_name', 'professors', ['first_name', 'last_name'])
    op.create_index('idx_reviews_professor_active', 'reviews', ['professor_id', 'is_removed'])
    op.create_index('idx_reviews_user_professor', 'reviews', ['user_id', 'professor_id'], unique=True)
    op.create_index('idx_reviews_created_at', 'reviews', ['created_at'])
    op.create_index('idx_review_flags_review', 'review_flags', ['review_id'])
    op.create_index('idx_review_flags_unique', 'review_flags', ['review_id', 'flagger_user_id'], unique=True)
    
    # Create full-text search indexes
    op.execute("""
        CREATE INDEX idx_professors_search 
        ON professors 
        USING GIN(to_tsvector('english', 
            first_name || ' ' || last_name || ' ' || 
            COALESCE(known_as, '') || ' ' || department
        ))
    """)
    
    op.execute("""
        CREATE INDEX idx_colleges_search 
        ON colleges 
        USING GIN(to_tsvector('english', name || ' ' || city || ' ' || state))
    """)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_colleges_search')
    op.drop_index('idx_professors_search')
    op.drop_index('idx_review_flags_unique')
    op.drop_index('idx_review_flags_review')
    op.drop_index('idx_reviews_created_at')
    op.drop_index('idx_reviews_user_professor')
    op.drop_index('idx_reviews_professor_active')
    op.drop_index('idx_professors_name')
    op.drop_index('idx_professors_college_dept')
    op.drop_index('idx_colleges_state_city')
    op.drop_index('idx_users_email')
    
    # Drop foreign key
    op.drop_constraint('fk_users_college_id', 'users', type_='foreignkey')
    
    # Drop tables
    op.drop_table('moderation_logs')
    op.drop_table('review_flags')
    op.drop_table('reviews')
    op.drop_table('professors')
    op.drop_table('colleges')
    op.drop_table('users')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS moderation_action_enum')
    op.execute('DROP TYPE IF EXISTS flag_reason_enum')
    op.execute('DROP TYPE IF EXISTS college_type_enum')
