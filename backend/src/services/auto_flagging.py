"""
Auto-flagging system for automated content moderation.

This module provides automatic flagging capabilities that integrate with
the content filter to automatically flag inappropriate content.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from supabase import Client
from .content_filter import content_filter, ContentAnalysis

logger = logging.getLogger(__name__)

class AutoFlaggingSystem:
    """Automated flagging system for content moderation."""
    
    def __init__(self, supabase: Client):
        """Initialize auto-flagging system with database connection."""
        self.supabase = supabase
        self.system_user_id = "00000000-0000-0000-0000-000000000000"  # System user for auto-flags
        
    async def process_review_content(self, review_id: str, review_text: str, 
                                   reviewer_id: str) -> ContentAnalysis:
        """
        Process review content and auto-flag if necessary.
        
        Args:
            review_id: ID of the review
            review_text: Text content of the review
            reviewer_id: ID of the user who wrote the review
            
        Returns:
            ContentAnalysis object with filtering results
        """
        try:
            # Analyze content
            analysis = content_filter.analyze_content(review_text)
            
            # If content should be auto-flagged, create flags and keep as pending
            if analysis.auto_flag:
                await self._create_auto_flags(review_id, analysis.flag_reasons, reviewer_id)
                
                # Update review moderation status to pending (requires admin review)
                await self._update_review_moderation_status(review_id, "pending")
                
                logger.info(f"Auto-flagged review {review_id} for reasons: {analysis.flag_reasons}")
            else:
                # Content is clean, auto-approve it
                await self._update_review_moderation_status(review_id, "approved")
                logger.info(f"Auto-approved clean review {review_id}")
            
            # Log content analysis for monitoring
            await self._log_content_analysis(review_id, analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error processing review content {review_id}: {str(e)}")
            # Return default analysis in case of error
            return ContentAnalysis(
                is_profane=False,
                profanity_score=0.0,
                is_spam=False,
                spam_score=0.0,
                quality_score=1.0,
                sentiment_score=0.0,
                auto_flag=False,
                flag_reasons=[],
                cleaned_text=review_text
            )
    
    async def process_college_review_content(self, review_id: str, review_text: str, 
                                           reviewer_id: str) -> ContentAnalysis:
        """
        Process college review content and auto-flag if necessary.
        
        Args:
            review_id: ID of the college review
            review_text: Text content of the review
            reviewer_id: ID of the user who wrote the review
            
        Returns:
            ContentAnalysis object with filtering results
        """
        try:
            # Analyze content
            analysis = content_filter.analyze_content(review_text)
            
            # If content should be auto-flagged, create flags and keep as pending
            if analysis.auto_flag:
                await self._create_auto_college_flags(review_id, analysis.flag_reasons, reviewer_id)
                
                # Update college review moderation status to pending (requires admin review)
                await self._update_college_review_moderation_status(review_id, "pending")
                
                logger.info(f"Auto-flagged college review {review_id} for reasons: {analysis.flag_reasons}")
            else:
                # Content is clean, auto-approve it
                await self._update_college_review_moderation_status(review_id, "approved")
                logger.info(f"Auto-approved clean college review {review_id}")
            
            # Log content analysis for monitoring
            await self._log_college_content_analysis(review_id, analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error processing college review content {review_id}: {str(e)}")
            # Return default analysis in case of error
            return ContentAnalysis(
                is_profane=False,
                profanity_score=0.0,
                is_spam=False,
                spam_score=0.0,
                quality_score=1.0,
                sentiment_score=0.0,
                auto_flag=False,
                flag_reasons=[],
                cleaned_text=review_text
            )
    
    async def _create_auto_flags(self, review_id: str, reasons: List[str], reviewer_id: str):
        """Create automatic flags for a professor review."""
        try:
            # Map reasons to flag types
            flag_type_mapping = {
                "profanity": "inappropriate",
                "spam": "spam",
                "quality": "low_quality",
                "sentiment": "harassment"
            }
            
            for reason in reasons:
                # Determine flag type based on reason
                flag_type = "inappropriate"  # default
                for key, value in flag_type_mapping.items():
                    if key.lower() in reason.lower():
                        flag_type = value
                        break
                
                # Create flag record
                flag_data = {
                    "review_id": review_id,
                    "reporter_id": self.system_user_id,
                    "flag_type": flag_type,
                    "description": f"Auto-flagged: {reason}",
                    "is_auto_generated": True,
                    "created_at": datetime.utcnow().isoformat()
                }
                
                result = self.supabase.table('review_flags').insert(flag_data).execute()
                if not result.data:
                    logger.error(f"Failed to create auto-flag for review {review_id}")
                    
        except Exception as e:
            logger.error(f"Error creating auto-flags for review {review_id}: {str(e)}")
    
    async def _create_auto_college_flags(self, review_id: str, reasons: List[str], reviewer_id: str):
        """Create automatic flags for a college review."""
        try:
            # Map reasons to flag types
            flag_type_mapping = {
                "profanity": "inappropriate",
                "spam": "spam",
                "quality": "low_quality",
                "sentiment": "harassment"
            }
            
            for reason in reasons:
                # Determine flag type based on reason
                flag_type = "inappropriate"  # default
                for key, value in flag_type_mapping.items():
                    if key.lower() in reason.lower():
                        flag_type = value
                        break
                
                # Create flag record
                flag_data = {
                    "college_review_id": review_id,
                    "reporter_id": self.system_user_id,
                    "flag_type": flag_type,
                    "description": f"Auto-flagged: {reason}",
                    "is_auto_generated": True,
                    "created_at": datetime.utcnow().isoformat()
                }
                
                result = self.supabase.table('college_review_flags').insert(flag_data).execute()
                if not result.data:
                    logger.error(f"Failed to create auto-flag for college review {review_id}")
                    
        except Exception as e:
            logger.error(f"Error creating auto-flags for college review {review_id}: {str(e)}")
    
    async def _update_review_moderation_status(self, review_id: str, status: str):
        """Update moderation status of a professor review."""
        try:
            result = self.supabase.table('reviews').update({
                "moderation_status": status,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", review_id).execute()
            
            if not result.data:
                logger.error(f"Failed to update moderation status for review {review_id}")
                
        except Exception as e:
            logger.error(f"Error updating review moderation status {review_id}: {str(e)}")
    
    async def _update_college_review_moderation_status(self, review_id: str, status: str):
        """Update moderation status of a college review."""
        try:
            result = self.supabase.table('college_reviews').update({
                "moderation_status": status,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", review_id).execute()
            
            if not result.data:
                logger.error(f"Failed to update moderation status for college review {review_id}")
                
        except Exception as e:
            logger.error(f"Error updating college review moderation status {review_id}: {str(e)}")
    
    async def _log_content_analysis(self, review_id: str, analysis: ContentAnalysis):
        """Log content analysis results for monitoring."""
        try:
            log_data = {
                "review_id": review_id,
                "profanity_score": analysis.profanity_score,
                "spam_score": analysis.spam_score,
                "quality_score": analysis.quality_score,
                "sentiment_score": analysis.sentiment_score,
                "auto_flagged": analysis.auto_flag,
                "flag_reasons": analysis.flag_reasons,
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
            # Store in content_analysis_logs table (we'll create this)
            result = self.supabase.table('content_analysis_logs').insert(log_data).execute()
            
        except Exception as e:
            # Don't fail the main process if logging fails
            logger.warning(f"Failed to log content analysis for review {review_id}: {str(e)}")
    
    async def _log_college_content_analysis(self, review_id: str, analysis: ContentAnalysis):
        """Log college content analysis results for monitoring."""
        try:
            log_data = {
                "college_review_id": review_id,
                "profanity_score": analysis.profanity_score,
                "spam_score": analysis.spam_score,
                "quality_score": analysis.quality_score,
                "sentiment_score": analysis.sentiment_score,
                "auto_flagged": analysis.auto_flag,
                "flag_reasons": analysis.flag_reasons,
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
            # Store in college_content_analysis_logs table (we'll create this)
            result = self.supabase.table('college_content_analysis_logs').insert(log_data).execute()
            
        except Exception as e:
            # Don't fail the main process if logging fails
            logger.warning(f"Failed to log college content analysis for review {review_id}: {str(e)}")
    
    async def get_auto_flag_stats(self) -> Dict[str, Any]:
        """Get statistics about auto-flagging system."""
        try:
            # Get auto-flag counts
            auto_flags_result = self.supabase.table('review_flags').select(
                'id, flag_type, created_at'
            ).eq('is_auto_generated', True).execute()
            
            college_auto_flags_result = self.supabase.table('college_review_flags').select(
                'id, flag_type, created_at'
            ).eq('is_auto_generated', True).execute()
            
            auto_flags = auto_flags_result.data or []
            college_auto_flags = college_auto_flags_result.data or []
            
            # Calculate statistics
            total_auto_flags = len(auto_flags) + len(college_auto_flags)
            
            # Flag type distribution
            flag_types = {}
            for flag in auto_flags + college_auto_flags:
                flag_type = flag.get('flag_type', 'unknown')
                flag_types[flag_type] = flag_types.get(flag_type, 0) + 1
            
            return {
                "total_auto_flags": total_auto_flags,
                "professor_review_flags": len(auto_flags),
                "college_review_flags": len(college_auto_flags),
                "flag_type_distribution": flag_types,
                "content_filter_stats": content_filter.get_filter_stats()
            }
            
        except Exception as e:
            logger.error(f"Error getting auto-flag stats: {str(e)}")
            return {
                "total_auto_flags": 0,
                "professor_review_flags": 0,
                "college_review_flags": 0,
                "flag_type_distribution": {},
                "content_filter_stats": content_filter.get_filter_stats()
            }
    
    async def bulk_analyze_existing_content(self, limit: int = 100) -> Dict[str, Any]:
        """
        Analyze existing content in bulk for retroactive flagging.
        
        Args:
            limit: Maximum number of reviews to process in one batch
            
        Returns:
            Statistics about the bulk analysis
        """
        try:
            stats = {
                "processed": 0,
                "flagged": 0,
                "errors": 0,
                "flag_reasons": {}
            }
            
            # Process professor reviews
            reviews_result = self.supabase.table('reviews').select(
                'id, review_text, student_id'
            ).eq('moderation_status', 'approved').limit(limit).execute()
            
            for review in reviews_result.data or []:
                try:
                    analysis = await self.process_review_content(
                        review['id'], 
                        review['review_text'], 
                        review['student_id']
                    )
                    
                    stats["processed"] += 1
                    
                    if analysis.auto_flag:
                        stats["flagged"] += 1
                        for reason in analysis.flag_reasons:
                            stats["flag_reasons"][reason] = stats["flag_reasons"].get(reason, 0) + 1
                            
                except Exception as e:
                    stats["errors"] += 1
                    logger.error(f"Error processing review {review['id']}: {str(e)}")
            
            # Process college reviews
            college_reviews_result = self.supabase.table('college_reviews').select(
                'id, review_text, student_id'
            ).eq('moderation_status', 'approved').limit(limit).execute()
            
            for review in college_reviews_result.data or []:
                try:
                    analysis = await self.process_college_review_content(
                        review['id'], 
                        review['review_text'], 
                        review['student_id']
                    )
                    
                    stats["processed"] += 1
                    
                    if analysis.auto_flag:
                        stats["flagged"] += 1
                        for reason in analysis.flag_reasons:
                            stats["flag_reasons"][reason] = stats["flag_reasons"].get(reason, 0) + 1
                            
                except Exception as e:
                    stats["errors"] += 1
                    logger.error(f"Error processing college review {review['id']}: {str(e)}")
            
            logger.info(f"Bulk analysis completed: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Error in bulk content analysis: {str(e)}")
            return {
                "processed": 0,
                "flagged": 0,
                "errors": 1,
                "flag_reasons": {}
            }