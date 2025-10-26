import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { API_BASE_URL } from '../config/api';

interface ReviewVotingProps {
  reviewId: string;
  initialHelpfulCount?: number;
  initialNotHelpfulCount?: number;
  userVote?: 'helpful' | 'not_helpful' | null;
}

const ReviewVoting: React.FC<ReviewVotingProps> = ({
  reviewId,
  initialHelpfulCount = 0,
  initialNotHelpfulCount = 0,
  userVote = null,
}) => {
  const { user, session } = useAuth();
  const { showToast } = useNotification();
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [notHelpfulCount, setNotHelpfulCount] = useState(initialNotHelpfulCount);
  const [currentVote, setCurrentVote] = useState<'helpful' | 'not_helpful' | null>(userVote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animatingButton, setAnimatingButton] = useState<'helpful' | 'not_helpful' | null>(null);

  const handleVote = async (voteType: 'helpful' | 'not_helpful') => {
    if (!user || !session) {
      showToast('Please log in to vote on reviews', 'info');
      return;
    }

    if (isSubmitting) return;

    // Optimistic UI update - instant feedback
    const previousVote = currentVote;
    const previousHelpful = helpfulCount;
    const previousNotHelpful = notHelpfulCount;

    // Trigger animation immediately
    setAnimatingButton(voteType);
    setTimeout(() => setAnimatingButton(null), 500);

    // Update UI instantly
    if (currentVote === voteType) {
      // Remove vote
      setCurrentVote(null);
      if (voteType === 'helpful') {
        setHelpfulCount(prev => Math.max(0, prev - 1));
      } else {
        setNotHelpfulCount(prev => Math.max(0, prev - 1));
      }
    } else {
      // Add or change vote
      setCurrentVote(voteType);
      if (previousVote === 'helpful') {
        setHelpfulCount(prev => Math.max(0, prev - 1));
        setNotHelpfulCount(prev => prev + 1);
      } else if (previousVote === 'not_helpful') {
        setNotHelpfulCount(prev => Math.max(0, prev - 1));
        setHelpfulCount(prev => prev + 1);
      } else {
        if (voteType === 'helpful') {
          setHelpfulCount(prev => prev + 1);
        } else {
          setNotHelpfulCount(prev => prev + 1);
        }
      }
    }

    setIsSubmitting(true);

    try {
      const token = session.access_token;
      
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vote_type: voteType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Sync with server response
        setHelpfulCount(data.helpful_count || 0);
        setNotHelpfulCount(data.not_helpful_count || 0);
        setCurrentVote(data.user_vote || null);
      } else {
        // Revert on error
        setCurrentVote(previousVote);
        setHelpfulCount(previousHelpful);
        setNotHelpfulCount(previousNotHelpful);
        
        const errorData = await response.json();
        console.error('Vote error:', errorData);
        showToast(errorData.detail || 'Failed to vote. Please try again.', 'error');
      }
    } catch (error) {
      // Revert on error
      setCurrentVote(previousVote);
      setHelpfulCount(previousHelpful);
      setNotHelpfulCount(previousNotHelpful);
      
      console.error('Network error:', error);
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center space-x-4 text-sm">
      <span className="text-gray-600">Was this review helpful?</span>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleVote('helpful')}
          disabled={isSubmitting}
          className={`inline-flex items-center px-3 py-1 rounded border transition-all duration-200 relative ${
            currentVote === 'helpful'
              ? 'bg-green-100 text-green-700 border-green-300'
              : 'text-gray-600 border-gray-300 hover:bg-green-50 hover:text-green-600'
          } disabled:opacity-50`}
        >
          <ThumbsUp 
            className={`w-4 h-4 mr-1 transition-all duration-300 ${
              animatingButton === 'helpful' 
                ? 'animate-upvote-pop' 
                : ''
            }`}
          />
          Yes ({helpfulCount})
        </button>
        
        <button
          onClick={() => handleVote('not_helpful')}
          disabled={isSubmitting}
          className={`inline-flex items-center px-3 py-1 rounded border transition-all duration-200 relative ${
            currentVote === 'not_helpful'
              ? 'bg-red-100 text-red-700 border-red-300'
              : 'text-gray-600 border-gray-300 hover:bg-red-50 hover:text-red-600'
          } disabled:opacity-50`}
        >
          <ThumbsDown 
            className={`w-4 h-4 mr-1 transition-all duration-300 ${
              animatingButton === 'not_helpful' 
                ? 'animate-downvote-shake' 
                : ''
            }`}
          />
          No ({notHelpfulCount})
        </button>
      </div>

      <style jsx>{`
        @keyframes upvote-pop {
          0% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 0 rgba(34, 197, 94, 0)); }
          25% { transform: scale(1.3) translateY(-4px); filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.8)); }
          50% { transform: scale(1.4) translateY(-6px); filter: drop-shadow(0 2px 12px rgba(34, 197, 94, 1)); }
          75% { transform: scale(1.1) translateY(-2px); filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.6)); }
          100% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 0 rgba(34, 197, 94, 0)); }
        }

        @keyframes downvote-shake {
          0% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0)); }
          15% { transform: scale(1.2) rotate(-5deg); filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8)); }
          30% { transform: scale(1.3) rotate(5deg); filter: drop-shadow(0 2px 10px rgba(239, 68, 68, 1)); }
          45% { transform: scale(1.2) rotate(-3deg); filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8)); }
          60% { transform: scale(1.1) rotate(2deg); filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.6)); }
          75% { transform: scale(1.05) rotate(-1deg); filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.4)); }
          100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0)); }
        }

        .animate-upvote-pop {
          animation: upvote-pop 0.5s ease-out;
        }

        .animate-downvote-shake {
          animation: downvote-shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ReviewVoting;