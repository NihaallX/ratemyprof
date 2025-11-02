"""
Notification Events System
Handles automatic notification triggering based on system events
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..lib.database import get_supabase
from ..lib.notification_templates import (
    NotificationService,
    NotificationTemplate,
    create_professor_trending_notification,
    create_weekly_stats_notification
)


class NotificationEventHandler:
    """
    Handles notification events and triggers appropriate templates
    """
    
    @staticmethod
    async def on_professor_added(professor_data: Dict[str, Any]):
        """
        Triggered when a new professor is added
        Sends notification to all users
        """
        notification = NotificationService.render_template(
            NotificationTemplate.NEW_PROFESSOR,
            {
                "professor_name": professor_data["name"],
                "department": professor_data["department"],
                "college_name": professor_data.get("college_name", "Vishwakarma University")
            }
        )
        
        await NotificationEventHandler._broadcast_notification(
            notification["title"],
            notification["message"],
            notification["type"],
            {"professor_id": professor_data["id"]}
        )
    
    @staticmethod
    async def on_college_added(college_data: Dict[str, Any]):
        """
        Triggered when a new college is added
        """
        notification = NotificationService.render_template(
            NotificationTemplate.NEW_COLLEGE,
            {
                "college_name": college_data["name"],
                "city": college_data["city"],
                "state": college_data["state"]
            }
        )
        
        await NotificationEventHandler._broadcast_notification(
            notification["title"],
            notification["message"],
            notification["type"],
            {"college_id": college_data["id"]}
        )
    
    @staticmethod
    async def check_professor_trending():
        """
        Check for trending professors (batch job - run every hour)
        Professor with 10+ reviews in last 24 hours
        """
        supabase = get_supabase()
        
        # Get professors with reviews in last 24 hours
        yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
        
        # This would be a more complex query in reality
        # For now, we'll check review counts
        response = supabase.rpc(
            'get_trending_professors',
            {'since_timestamp': yesterday}
        ).execute()
        
        trending = response.data if response.data else []
        
        for prof in trending:
            if prof['recent_review_count'] >= 10:
                notification = create_professor_trending_notification(
                    prof['name'],
                    prof['recent_review_count']
                )
                
                await NotificationEventHandler._broadcast_notification(
                    notification["title"],
                    notification["message"],
                    notification["type"],
                    {"professor_id": prof["id"]}
                )
    
    @staticmethod
    async def check_professor_milestones():
        """
        Check for professors hitting review milestones (10, 25, 50, 100, etc.)
        """
        supabase = get_supabase()
        milestones = [10, 25, 50, 100, 200, 500]
        
        # Check professors who just hit milestones
        # This would track last_notified_count to avoid duplicate notifications
        response = supabase.table("professors")\
            .select("id, name, total_reviews")\
            .execute()
        
        professors = response.data if response.data else []
        
        for prof in professors:
            review_count = prof.get('total_reviews', 0)
            if review_count in milestones:
                # Check if we've already notified for this milestone
                # (In production, you'd track this in a separate table)
                notification = NotificationService.render_template(
                    NotificationTemplate.PROFESSOR_MILESTONE_REVIEWS,
                    {
                        "professor_name": prof["name"],
                        "milestone": review_count
                    }
                )
                
                await NotificationEventHandler._broadcast_notification(
                    notification["title"],
                    notification["message"],
                    "new_professor",
                    {"professor_id": prof["id"], "milestone": review_count}
                )
    
    @staticmethod
    async def send_weekly_top_professors():
        """
        Weekly analytics - Top 3 professors by rating
        Run every Monday
        """
        supabase = get_supabase()
        
        response = supabase.table("professors")\
            .select("id, name, average_rating")\
            .gte("total_reviews", 5)\
            .order("average_rating", desc=True)\
            .limit(3)\
            .execute()
        
        top_professors = response.data if response.data else []
        
        if len(top_professors) >= 3:
            notification = create_weekly_stats_notification([
                {"name": top_professors[0]["name"], "rating": top_professors[0]["average_rating"]},
                {"name": top_professors[1]["name"], "rating": top_professors[1]["average_rating"]},
                {"name": top_professors[2]["name"], "rating": top_professors[2]["average_rating"]},
            ])
            
            await NotificationEventHandler._broadcast_notification(
                notification["title"],
                notification["message"],
                notification["type"],
                {"week": datetime.utcnow().isocalendar()[1]}
            )
    
    @staticmethod
    async def send_monthly_stats():
        """
        Monthly recap with platform statistics
        Run on 1st of every month
        """
        supabase = get_supabase()
        
        # Get month's stats
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
        
        # Count reviews this month
        reviews_response = supabase.table("reviews")\
            .select("id", count="exact")\
            .gte("created_at", month_start.isoformat())\
            .execute()
        
        # Count new professors
        professors_response = supabase.table("professors")\
            .select("id", count="exact")\
            .gte("created_at", month_start.isoformat())\
            .execute()
        
        # Count active users (users who reviewed/voted this month)
        users_response = supabase.rpc('get_active_users_count', {
            'since_date': month_start.isoformat()
        }).execute()
        
        notification = NotificationService.render_template(
            NotificationTemplate.MONTHLY_STATS,
            {
                "total_reviews": reviews_response.count or 0,
                "new_professors": professors_response.count or 0,
                "active_users": users_response.data if users_response.data else 0
            }
        )
        
        await NotificationEventHandler._broadcast_notification(
            notification["title"],
            notification["message"],
            notification["type"],
            {"month": month_start.strftime("%B %Y")}
        )
    
    @staticmethod
    async def check_trending_department():
        """
        Find department with most reviews this week
        """
        supabase = get_supabase()
        week_start = (datetime.utcnow() - timedelta(days=7)).isoformat()
        
        # This would use a more complex aggregation query
        response = supabase.rpc(
            'get_trending_department',
            {'since_timestamp': week_start}
        ).execute()
        
        if response.data:
            dept_data = response.data[0]
            notification = NotificationService.render_template(
                NotificationTemplate.TRENDING_DEPARTMENT,
                {
                    "department": dept_data["department"],
                    "review_count": dept_data["review_count"]
                }
            )
            
            await NotificationEventHandler._broadcast_notification(
                notification["title"],
                notification["message"],
                notification["type"],
                {"department": dept_data["department"]}
            )
    
    @staticmethod
    async def _broadcast_notification(
        title: str,
        message: str,
        notification_type: str,
        metadata: Dict[str, Any]
    ):
        """
        Internal method to broadcast notification to all users
        """
        supabase = get_supabase()
        
        try:
            # Use the database function to create notifications for all users
            result = supabase.rpc(
                'create_broadcast_notification',
                {
                    'p_title': title,
                    'p_message': message,
                    'p_type': notification_type,
                    'p_metadata': metadata
                }
            ).execute()
            
            print(f"✅ Broadcast notification sent: {title} to {result.data} users")
            return result.data
        except Exception as e:
            print(f"❌ Failed to broadcast notification: {e}")
            raise


# Helper functions for manual triggers
async def trigger_celebration(title: str, message: str):
    """
    Manually send a celebration notification
    Example: trigger_celebration("1000 Users!", "We just hit 1000 users! Hope you guys have fun celebrating with us!")
    """
    from ..lib.notification_templates import create_celebration_notification
    
    notification = create_celebration_notification(title, message)
    await NotificationEventHandler._broadcast_notification(
        notification["title"],
        notification["message"],
        notification["type"],
        {"custom": True, "sent_at": datetime.utcnow().isoformat()}
    )


async def trigger_announcement(title: str, message: str):
    """
    Send custom announcement
    Example: trigger_announcement("New Feature", "Check out our new professor comparison feature!")
    """
    notification = NotificationService.render_template(
        NotificationTemplate.ANNOUNCEMENT,
        {
            "announcement_title": title,
            "announcement_message": message
        }
    )
    
    await NotificationEventHandler._broadcast_notification(
        notification["title"],
        notification["message"],
        notification["type"],
        {"announcement": True}
    )
