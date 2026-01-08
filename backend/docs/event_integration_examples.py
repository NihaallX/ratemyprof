"""
Integration Examples: How to use Event Bus in API endpoints

This file demonstrates how to emit events from various API endpoints
to trigger notifications automatically.

Copy these patterns into your actual API files (reviews.py, comments.py, etc.)
"""

from fastapi import APIRouter, Depends, HTTPException
from src.lib.auth import get_current_user
from src.lib.events import (
    emit_review_created,
    emit_review_helpful_vote,
    emit_comment_reply,
    emit_comment_upvote,
    emit_user_level_up
)

router = APIRouter()


# ============================================================================
# EXAMPLE 1: Review Creation (add to src/api/reviews.py)
# ============================================================================

async def create_review_example(
    review_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Example: Emit event after review is created
    """
    # ... existing review creation logic ...
    
    # After successful review creation:
    review_id = "newly-created-review-uuid"
    author_id = current_user["id"]
    professor_id = review_data["professor_id"]
    rating = review_data["rating"]
    
    # Emit event (non-blocking, async)
    await emit_review_created(
        review_id=review_id,
        author_id=author_id,
        professor_id=professor_id,
        rating=rating
    )
    
    # Future: Update user points, check for level-up
    # await update_user_points(author_id, points_earned=10)
    
    return {"success": True, "review_id": review_id}


# ============================================================================
# EXAMPLE 2: Helpful Vote (add to src/api/reviews.py vote endpoint)
# ============================================================================

async def vote_review_helpful_example(
    review_id: str,
    current_user = Depends(get_current_user)
):
    """
    Example: Emit event when review receives helpful vote
    """
    # ... existing vote logic ...
    
    # After vote is recorded:
    voter_id = current_user["id"]
    
    # Get updated vote count
    updated_vote_count = 15  # fetch from database
    
    # Emit event to notify review author
    await emit_review_helpful_vote(
        review_id=review_id,
        voter_id=voter_id,
        vote_count=updated_vote_count
    )
    
    # Future: Award points to voter
    # await update_user_points(voter_id, points_earned=1)
    
    return {"success": True, "vote_count": updated_vote_count}


# ============================================================================
# EXAMPLE 3: Comment on Review (add to src/api/comments.py)
# ============================================================================

from src.lib.events import emit_review_comment

async def create_comment_example(
    comment_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Example: Emit event when comment is posted on review
    """
    # ... existing comment creation logic ...
    
    # After comment is created:
    comment_id = "newly-created-comment-uuid"
    review_id = comment_data["review_id"]
    commenter_id = current_user["id"]
    
    # Emit event to notify review author
    await emit_review_comment(
        comment_id=comment_id,
        review_id=review_id,
        commenter_id=commenter_id
    )
    
    # Future: Award points for engagement
    # await update_user_points(commenter_id, points_earned=5)
    
    return {"success": True, "comment_id": comment_id}


# ============================================================================
# EXAMPLE 4: Reply to Comment (add to src/api/comments.py)
# ============================================================================

async def reply_to_comment_example(
    reply_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Example: Emit event when someone replies to a comment
    """
    # ... existing reply creation logic ...
    
    # After reply is created:
    reply_comment_id = "newly-created-reply-uuid"
    parent_comment_id = reply_data["parent_id"]
    replier_id = current_user["id"]
    
    # Emit event to notify parent comment author
    await emit_comment_reply(
        comment_id=reply_comment_id,
        parent_comment_id=parent_comment_id,
        replier_id=replier_id
    )
    
    return {"success": True, "reply_id": reply_comment_id}


# ============================================================================
# EXAMPLE 5: Upvote Comment (add to src/api/comments.py)
# ============================================================================

async def upvote_comment_example(
    comment_id: str,
    current_user = Depends(get_current_user)
):
    """
    Example: Emit event when comment receives upvote
    """
    # ... existing upvote logic ...
    
    # After upvote is recorded:
    voter_id = current_user["id"]
    updated_upvote_count = 25  # fetch from database
    
    # Emit event to notify comment author
    await emit_comment_upvote(
        comment_id=comment_id,
        voter_id=voter_id,
        upvote_count=updated_upvote_count
    )
    
    return {"success": True, "upvote_count": updated_upvote_count}


# ============================================================================
# EXAMPLE 6: User Levels Up (add to gamification service)
# ============================================================================

async def check_user_level_up_example(user_id: str, new_points: int):
    """
    Example: Emit event when user gains enough points to level up
    (This would be called from a gamification service)
    """
    # Calculate new level based on points
    # Level 1: 0-99 points
    # Level 2: 100-249 points
    # Level 3: 250-499 points, etc.
    
    new_level = (new_points // 100) + 1
    
    # Check if user leveled up
    # ... fetch old level from database ...
    old_level = 2
    
    if new_level > old_level:
        # Emit level up event
        await emit_user_level_up(
            user_id=user_id,
            new_level=new_level,
            points=new_points
        )
        
        # Future: Check for badges earned
        # await check_badge_eligibility(user_id)


# ============================================================================
# USAGE NOTES
# ============================================================================

"""
HOW TO INTEGRATE:

1. Import the appropriate emit_* function at the top of your API file:
   from src.lib.events import emit_review_created, emit_review_helpful_vote

2. After your business logic succeeds, call the emit function:
   await emit_review_created(review_id, author_id, professor_id, rating)

3. Events are stored in the database immediately and processed by the
   background worker within 5 minutes (configurable).

4. If emit fails (database error), it will raise an exception. You can:
   - Let it propagate (recommended - ensures notification system works)
   - Catch and log (if notifications are non-critical for your endpoint)

5. The worker will:
   - Fetch unprocessed events
   - Determine target users (review author, comment author, etc.)
   - Apply throttling (max 3/hour) and deduplication (30min window)
   - Create notifications in the database
   - Mark events as processed

6. Users will see notifications via:
   - In-app notification center (GET /v1/notifications)
   - Push notifications (if subscribed, Task 4)
   - Weekly digest (Task 5)
"""
