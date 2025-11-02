"""
Notification Templates System
Professional template-based notification handling with pre-built templates
"""

from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime


class NotificationTemplate(Enum):
    """Pre-defined notification templates"""
    
    # System Templates
    WELCOME = "welcome"
    ACCOUNT_VERIFIED = "account_verified"
    
    # Professor Events
    NEW_PROFESSOR = "new_professor"
    PROFESSOR_TRENDING = "professor_trending"
    PROFESSOR_TOP_RATED = "professor_top_rated"
    PROFESSOR_MILESTONE_REVIEWS = "professor_milestone_reviews"
    
    # College Events
    NEW_COLLEGE = "new_college"
    COLLEGE_TRENDING = "college_trending"
    
    # Analytics & Insights
    WEEKLY_TOP_PROFESSORS = "weekly_top_professors"
    MONTHLY_STATS = "monthly_stats"
    TRENDING_DEPARTMENT = "trending_department"
    MOST_REVIEWED_SUBJECT = "most_reviewed_subject"
    
    # Engagement
    REVIEW_MILESTONE = "review_milestone"
    THANK_YOU = "thank_you"
    ENCOURAGEMENT = "encouragement"
    
    # Custom Announcements
    ANNOUNCEMENT = "announcement"
    FEATURE_LAUNCH = "feature_launch"
    MAINTENANCE = "maintenance"
    CELEBRATION = "celebration"


# Template Definitions with placeholders
TEMPLATES: Dict[str, Dict[str, Any]] = {
    # System Templates
    NotificationTemplate.WELCOME.value: {
        "title": "🎉 Welcome to RateMyProf!",
        "message": "Hey {user_name}! Ready to discover the best professors and share your experiences? Let's get started!",
        "icon": "👋",
        "type": "system"
    },
    
    NotificationTemplate.ACCOUNT_VERIFIED.value: {
        "title": "✅ Account Verified!",
        "message": "You're all set, {user_name}! Start exploring professors and colleges now.",
        "icon": "✅",
        "type": "system"
    },
    
    # Professor Events
    NotificationTemplate.NEW_PROFESSOR.value: {
        "title": "👨‍🏫 New Professor Added!",
        "message": "Check out {professor_name} from {department} department at {college_name}!",
        "icon": "👨‍🏫",
        "type": "new_professor"
    },
    
    NotificationTemplate.PROFESSOR_TRENDING.value: {
        "title": "🔥 Professor Trending Now!",
        "message": "{professor_name} is trending! {review_count} reviews in the last 24 hours. See what students are saying!",
        "icon": "🔥",
        "type": "new_professor"
    },
    
    NotificationTemplate.PROFESSOR_TOP_RATED.value: {
        "title": "⭐ Top Rated Professor Alert!",
        "message": "{professor_name} just hit {rating}/5.0 with {review_count} reviews! One of the highest-rated professors!",
        "icon": "⭐",
        "type": "new_professor"
    },
    
    NotificationTemplate.PROFESSOR_MILESTONE_REVIEWS.value: {
        "title": "🎯 Milestone Reached!",
        "message": "{professor_name} just received their {milestone}th review! Check out what students are saying.",
        "icon": "🎯",
        "type": "new_professor"
    },
    
    # College Events
    NotificationTemplate.NEW_COLLEGE.value: {
        "title": "🏛️ New College Added!",
        "message": "{college_name} from {city}, {state} is now on RateMyProf!",
        "icon": "🏛️",
        "type": "new_college"
    },
    
    NotificationTemplate.COLLEGE_TRENDING.value: {
        "title": "🌟 College Trending!",
        "message": "{college_name} has {new_professors} new professors added this week. Explore now!",
        "icon": "🌟",
        "type": "new_college"
    },
    
    # Analytics & Insights
    NotificationTemplate.WEEKLY_TOP_PROFESSORS.value: {
        "title": "📊 This Week's Top Professors",
        "message": "Top 3: {professor_1} ({rating_1}⭐), {professor_2} ({rating_2}⭐), {professor_3} ({rating_3}⭐). See the full list!",
        "icon": "📊",
        "type": "custom"
    },
    
    NotificationTemplate.MONTHLY_STATS.value: {
        "title": "📈 Monthly Recap",
        "message": "This month: {total_reviews} reviews posted, {new_professors} professors added, {active_users} active students!",
        "icon": "📈",
        "type": "custom"
    },
    
    NotificationTemplate.TRENDING_DEPARTMENT.value: {
        "title": "🎓 Trending Department",
        "message": "{department} is the most reviewed department this week with {review_count} reviews!",
        "icon": "🎓",
        "type": "custom"
    },
    
    NotificationTemplate.MOST_REVIEWED_SUBJECT.value: {
        "title": "📚 Hot Subject Alert!",
        "message": "{subject} has {review_count} reviews this week! Students are talking about it.",
        "icon": "📚",
        "type": "custom"
    },
    
    # Engagement
    NotificationTemplate.REVIEW_MILESTONE.value: {
        "title": "🏆 You're Amazing!",
        "message": "Congratulations {user_name}! You've written {review_count} reviews and helped the community!",
        "icon": "🏆",
        "type": "system"
    },
    
    NotificationTemplate.THANK_YOU.value: {
        "title": "💙 Thank You!",
        "message": "Thanks for being awesome, {user_name}! Your {review_count} reviews have helped {helped_count}+ students!",
        "icon": "💙",
        "type": "system"
    },
    
    NotificationTemplate.ENCOURAGEMENT.value: {
        "title": "✨ Share Your Experience!",
        "message": "Hey {user_name}! Have you taken classes recently? Help others by sharing your professor reviews!",
        "icon": "✨",
        "type": "system"
    },
    
    # Custom Announcements
    NotificationTemplate.ANNOUNCEMENT.value: {
        "title": "📢 {announcement_title}",
        "message": "{announcement_message}",
        "icon": "📢",
        "type": "custom"
    },
    
    NotificationTemplate.FEATURE_LAUNCH.value: {
        "title": "🚀 New Feature: {feature_name}",
        "message": "{feature_description} Try it out now!",
        "icon": "🚀",
        "type": "custom"
    },
    
    NotificationTemplate.MAINTENANCE.value: {
        "title": "🔧 Scheduled Maintenance",
        "message": "We'll be upgrading our systems on {maintenance_date}. Expected downtime: {duration}. Thanks for your patience!",
        "icon": "🔧",
        "type": "system"
    },
    
    NotificationTemplate.CELEBRATION.value: {
        "title": "🎊 {celebration_title}",
        "message": "{celebration_message} Hope you guys have fun! 🎉",
        "icon": "🎊",
        "type": "custom"
    },
}


class NotificationService:
    """
    Professional notification service with template rendering
    """
    
    @staticmethod
    def render_template(template: NotificationTemplate, data: Dict[str, Any]) -> Dict[str, str]:
        """
        Render a notification template with provided data
        
        Args:
            template: The template enum to use
            data: Dictionary containing placeholder values
            
        Returns:
            Dict with title, message, icon, and type
            
        Example:
            >>> NotificationService.render_template(
            ...     NotificationTemplate.PROFESSOR_TRENDING,
            ...     {
            ...         "professor_name": "Dr. Sharma",
            ...         "review_count": 25
            ...     }
            ... )
        """
        template_data = TEMPLATES.get(template.value)
        
        if not template_data:
            raise ValueError(f"Template {template.value} not found")
        
        # Render title and message with data
        try:
            rendered = {
                "title": template_data["title"].format(**data),
                "message": template_data["message"].format(**data),
                "icon": template_data["icon"],
                "type": template_data["type"]
            }
            return rendered
        except KeyError as e:
            raise ValueError(f"Missing required data field: {e}")
    
    @staticmethod
    def get_template_info(template: NotificationTemplate) -> Dict[str, Any]:
        """Get template structure and required fields"""
        template_data = TEMPLATES.get(template.value)
        if not template_data:
            return {}
        
        # Extract required fields from template
        import re
        title_fields = re.findall(r'{(\w+)}', template_data["title"])
        message_fields = re.findall(r'{(\w+)}', template_data["message"])
        
        return {
            "template_id": template.value,
            "title": template_data["title"],
            "message": template_data["message"],
            "icon": template_data["icon"],
            "type": template_data["type"],
            "required_fields": list(set(title_fields + message_fields))
        }
    
    @staticmethod
    def get_all_templates() -> Dict[str, Dict[str, Any]]:
        """Get all available templates with their info"""
        return {
            template.value: NotificationService.get_template_info(template)
            for template in NotificationTemplate
        }


# Quick access functions for common use cases
def create_welcome_notification(user_name: str) -> Dict[str, str]:
    """Create a welcome notification for new user"""
    return NotificationService.render_template(
        NotificationTemplate.WELCOME,
        {"user_name": user_name}
    )


def create_professor_trending_notification(professor_name: str, review_count: int) -> Dict[str, str]:
    """Create trending professor notification"""
    return NotificationService.render_template(
        NotificationTemplate.PROFESSOR_TRENDING,
        {
            "professor_name": professor_name,
            "review_count": review_count
        }
    )


def create_weekly_stats_notification(top_professors: list) -> Dict[str, str]:
    """Create weekly top professors notification"""
    return NotificationService.render_template(
        NotificationTemplate.WEEKLY_TOP_PROFESSORS,
        {
            "professor_1": top_professors[0]["name"],
            "rating_1": top_professors[0]["rating"],
            "professor_2": top_professors[1]["name"],
            "rating_2": top_professors[1]["rating"],
            "professor_3": top_professors[2]["name"],
            "rating_3": top_professors[2]["rating"],
        }
    )


def create_celebration_notification(title: str, message: str) -> Dict[str, str]:
    """Create a celebration/fun notification"""
    return NotificationService.render_template(
        NotificationTemplate.CELEBRATION,
        {
            "celebration_title": title,
            "celebration_message": message
        }
    )
