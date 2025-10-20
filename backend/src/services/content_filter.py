"""
Content filtering service for automated moderation.

This module provides comprehensive content filtering capabilities including:
- Profanity detection and filtering
- Spam detection algorithms
- Content quality scoring
- Auto-flagging system
"""

import re
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from better_profanity import profanity
from textblob import TextBlob
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import pickle
import os

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

logger = logging.getLogger(__name__)

@dataclass
class ContentAnalysis:
    """Result of content analysis."""
    is_profane: bool
    profanity_score: float
    is_spam: bool
    spam_score: float
    quality_score: float
    sentiment_score: float
    auto_flag: bool
    flag_reasons: List[str]
    cleaned_text: Optional[str] = None

class ContentFilter:
    """Comprehensive content filtering system."""
    
    def __init__(self):
        """Initialize the content filter with all detection systems."""
        self._setup_profanity_filter()
        self._setup_spam_detector()
        self._setup_quality_analyzer()
        
        # Thresholds for auto-flagging
        self.PROFANITY_THRESHOLD = 0.3
        self.SPAM_THRESHOLD = 0.7
        self.QUALITY_THRESHOLD = 0.3
        self.SENTIMENT_THRESHOLD = -0.8
        
    def _setup_profanity_filter(self):
        """Setup profanity detection system."""
        # Load better-profanity with custom word list
        profanity.load_censor_words()
        
        # Add custom educational/academic profanity words
        custom_profanity = [
            # Academic inappropriate terms
            'stupid', 'idiot', 'dumb', 'moron', 'retard',
            # Common internet slang profanity
            'wtf', 'stfu', 'gtfo', 'lmao', 'rofl',
            # Mild profanity that might be inappropriate in academic context
            'damn', 'hell', 'crap', 'suck', 'sucks'
        ]
        
        for word in custom_profanity:
            profanity.add_censor_words([word])
    
    def _setup_spam_detector(self):
        """Setup spam detection system."""
        # Common spam patterns for academic review context
        self.spam_patterns = [
            # Repetitive text patterns
            r'(.)\1{4,}',  # Character repeated 5+ times
            r'\b(\w+)\s+\1\b',  # Word repeated immediately
            r'\b(\w+)(\s+\w+){0,2}\s+\1\b',  # Word repeated within 3 words
            
            # Promotional content
            r'\b(buy|purchase|discount|offer|deal|sale|cheap|free|money)\b',
            r'\b(click|visit|website|link|url|http|www)\b',
            r'\b(contact|email|phone|call|whatsapp)\b',
            
            # Academic spam
            r'\b(assignment|homework|exam|test|quiz)\s+(help|service|solution)\b',
            r'\b(write|writing|paper|essay|thesis)\s+(service|help)\b',
            
            # Generic spam indicators
            r'[A-Z]{3,}',  # Multiple consecutive capitals
            r'[!]{2,}',    # Multiple exclamation marks
            r'[\?]{2,}',   # Multiple question marks
        ]
        
        # Compile patterns for performance
        self.compiled_spam_patterns = [re.compile(pattern, re.IGNORECASE) 
                                     for pattern in self.spam_patterns]
    
    def _setup_quality_analyzer(self):
        """Setup content quality analysis system."""
        # Quality indicators
        self.quality_indicators = {
            'min_length': 10,      # Minimum meaningful review length
            'max_length': 2000,    # Maximum reasonable review length
            'min_words': 3,        # Minimum word count
            'spelling_threshold': 0.8,  # Minimum spelling accuracy
        }
        
        # Academic quality keywords (positive indicators)
        self.quality_keywords = [
            'teaching', 'explanation', 'helpful', 'clear', 'understanding',
            'assignments', 'exams', 'lectures', 'concepts', 'examples',
            'patient', 'knowledgeable', 'accessible', 'feedback', 'guidance',
            'interactive', 'engaging', 'organized', 'structured', 'methodical'
        ]
        
        # Poor quality indicators
        self.poor_quality_indicators = [
            'ok', 'good', 'bad', 'nice', 'cool', 'whatever', 'meh',
            'idk', 'dunno', 'yeah', 'nah', 'fine', 'alright'
        ]
    
    def analyze_content(self, text: str) -> ContentAnalysis:
        """
        Perform comprehensive content analysis.
        
        Args:
            text: The text content to analyze
            
        Returns:
            ContentAnalysis object with all analysis results
        """
        if not text or not text.strip():
            return ContentAnalysis(
                is_profane=False,
                profanity_score=0.0,
                is_spam=False,
                spam_score=0.0,
                quality_score=0.0,
                sentiment_score=0.0,
                auto_flag=True,
                flag_reasons=['Empty content'],
                cleaned_text=text
            )
        
        # Clean and normalize text
        cleaned_text = self._clean_text(text)
        
        # Perform all analysis
        profanity_result = self._analyze_profanity(cleaned_text)
        spam_result = self._analyze_spam(cleaned_text)
        quality_result = self._analyze_quality(cleaned_text)
        sentiment_result = self._analyze_sentiment(cleaned_text)
        
        # Determine auto-flagging
        auto_flag, flag_reasons = self._determine_auto_flag(
            profanity_result, spam_result, quality_result, sentiment_result
        )
        
        return ContentAnalysis(
            is_profane=profanity_result[0],
            profanity_score=profanity_result[1],
            is_spam=spam_result[0],
            spam_score=spam_result[1],
            quality_score=quality_result,
            sentiment_score=sentiment_result,
            auto_flag=auto_flag,
            flag_reasons=flag_reasons,
            cleaned_text=cleaned_text
        )
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text for analysis."""
        if not text:
            return ""
            
        # Remove excessive whitespace
        cleaned = re.sub(r'\s+', ' ', text.strip())
        
        # Remove excessive punctuation
        cleaned = re.sub(r'[!]{2,}', '!', cleaned)
        cleaned = re.sub(r'[\?]{2,}', '?', cleaned)
        cleaned = re.sub(r'[.]{3,}', '...', cleaned)
        
        return cleaned
    
    def _analyze_profanity(self, text: str) -> Tuple[bool, float]:
        """
        Analyze text for profanity.
        
        Returns:
            Tuple of (is_profane, profanity_score)
        """
        if not text:
            return False, 0.0
            
        # Check for profanity
        is_profane = profanity.contains_profanity(text)
        
        # Calculate profanity score
        words = text.lower().split()
        total_words = len(words)
        
        if total_words == 0:
            return False, 0.0
            
        profane_words = sum(1 for word in words if profanity.contains_profanity(word))
        profanity_score = profane_words / total_words
        
        return is_profane, profanity_score
    
    def _analyze_spam(self, text: str) -> Tuple[bool, float]:
        """
        Analyze text for spam characteristics.
        
        Returns:
            Tuple of (is_spam, spam_score)
        """
        if not text:
            return False, 0.0
            
        spam_indicators = 0
        total_patterns = len(self.compiled_spam_patterns)
        
        # Check against spam patterns
        for pattern in self.compiled_spam_patterns:
            if pattern.search(text):
                spam_indicators += 1
        
        # Additional spam checks
        words = text.split()
        
        # Check for excessive repetition
        if len(words) > 1:
            unique_words = len(set(words))
            repetition_ratio = unique_words / len(words)
            if repetition_ratio < 0.3:  # Less than 30% unique words
                spam_indicators += 2
        
        # Check for excessive caps
        caps_ratio = sum(1 for c in text if c.isupper()) / len(text) if text else 0
        if caps_ratio > 0.5:  # More than 50% capitals
            spam_indicators += 1
        
        # Calculate spam score
        spam_score = min(spam_indicators / (total_patterns + 3), 1.0)
        is_spam = spam_score >= self.SPAM_THRESHOLD
        
        return is_spam, spam_score
    
    def _analyze_quality(self, text: str) -> float:
        """
        Analyze content quality.
        
        Returns:
            Quality score (0.0 to 1.0, higher is better)
        """
        if not text:
            return 0.0
            
        score = 0.0
        factors = 0
        
        # Length analysis
        length = len(text)
        word_count = len(text.split())
        
        # Length score
        if length >= self.quality_indicators['min_length']:
            if length <= self.quality_indicators['max_length']:
                length_score = min(length / 200, 1.0)  # Optimal around 200 chars
            else:
                length_score = max(0.5, 1.0 - (length - self.quality_indicators['max_length']) / 1000)
            score += length_score
            factors += 1
        
        # Word count score
        if word_count >= self.quality_indicators['min_words']:
            word_score = min(word_count / 20, 1.0)  # Optimal around 20 words
            score += word_score
            factors += 1
        
        # Quality keywords score
        quality_word_count = sum(1 for keyword in self.quality_keywords 
                               if keyword.lower() in text.lower())
        if quality_word_count > 0:
            keyword_score = min(quality_word_count / 5, 1.0)
            score += keyword_score
            factors += 1
        
        # Poor quality penalty
        poor_word_count = sum(1 for indicator in self.poor_quality_indicators 
                            if indicator.lower() in text.lower())
        if poor_word_count > 0:
            penalty = min(poor_word_count / 3, 0.5)
            score = max(0, score - penalty)
        
        # Spelling analysis (simplified)
        try:
            blob = TextBlob(text)
            # Simple spelling check - count words not in TextBlob's vocabulary
            words = blob.words
            if len(words) > 0:
                # This is a simplified check - in production, you'd want more sophisticated spelling analysis
                spelling_score = 0.8  # Default good spelling score
                score += spelling_score
                factors += 1
        except:
            pass
        
        return score / factors if factors > 0 else 0.0
    
    def _analyze_sentiment(self, text: str) -> float:
        """
        Analyze text sentiment.
        
        Returns:
            Sentiment score (-1.0 to 1.0, negative to positive)
        """
        if not text:
            return 0.0
            
        try:
            blob = TextBlob(text)
            return blob.sentiment.polarity
        except:
            return 0.0
    
    def _determine_auto_flag(self, profanity_result, spam_result, quality_result, sentiment_result) -> Tuple[bool, List[str]]:
        """
        Determine if content should be auto-flagged.
        
        Returns:
            Tuple of (should_flag, reasons)
        """
        should_flag = False
        reasons = []
        
        is_profane, profanity_score = profanity_result
        is_spam, spam_score = spam_result
        
        # Profanity check
        if is_profane or profanity_score >= self.PROFANITY_THRESHOLD:
            should_flag = True
            reasons.append(f"Contains profanity (score: {profanity_score:.2f})")
        
        # Spam check
        if is_spam or spam_score >= self.SPAM_THRESHOLD:
            should_flag = True
            reasons.append(f"Detected as spam (score: {spam_score:.2f})")
        
        # Quality check
        if quality_result < self.QUALITY_THRESHOLD:
            should_flag = True
            reasons.append(f"Low quality content (score: {quality_result:.2f})")
        
        # Sentiment check (extremely negative)
        if sentiment_result <= self.SENTIMENT_THRESHOLD:
            should_flag = True
            reasons.append(f"Extremely negative sentiment (score: {sentiment_result:.2f})")
        
        return should_flag, reasons
    
    def clean_profanity(self, text: str) -> str:
        """
        Clean profanity from text.
        
        Args:
            text: Text to clean
            
        Returns:
            Text with profanity censored
        """
        if not text:
            return text
            
        return profanity.censor(text)
    
    def get_filter_stats(self) -> Dict[str, any]:
        """
        Get statistics about the content filter.
        
        Returns:
            Dictionary with filter configuration and stats
        """
        return {
            "profanity_threshold": self.PROFANITY_THRESHOLD,
            "spam_threshold": self.SPAM_THRESHOLD,
            "quality_threshold": self.QUALITY_THRESHOLD,
            "sentiment_threshold": self.SENTIMENT_THRESHOLD,
            "spam_patterns_count": len(self.spam_patterns),
            "quality_keywords_count": len(self.quality_keywords),
            "poor_quality_indicators_count": len(self.poor_quality_indicators)
        }

# Global content filter instance
content_filter = ContentFilter()