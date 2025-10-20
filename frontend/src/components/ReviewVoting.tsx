import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

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

  const handleVote = async (voteType: 'helpful' | 'not_helpful') => {
    if (!user || !session) {
      showToast('Please log in to vote on reviews', 'info');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the access token from the session
      const token = session.access_token;
      
      const response = await fetch(`http://localhost:8000/v1/reviews/${reviewId}/vote`, {
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
        
        // Update counts and vote status from the API response
        setHelpfulCount(data.helpful_count || 0);
        setNotHelpfulCount(data.not_helpful_count || 0);
        setCurrentVote(data.user_vote || null);
      } else {
        const errorData = await response.json();
        console.error('Vote error:', errorData);
        showToast(errorData.detail || 'Failed to vote. Please try again.', 'error');
      }
    } catch (error) {
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
          className={`inline-flex items-center px-3 py-1 rounded border transition-colors ${
            currentVote === 'helpful'
              ? 'bg-green-100 text-green-700 border-green-300'
              : 'text-gray-600 border-gray-300 hover:bg-green-50 hover:text-green-600'
          } disabled:opacity-50`}
        >
          <ThumbsUp className="w-4 h-4 mr-1" />
          Yes ({helpfulCount})
        </button>
        
        <button
          onClick={() => handleVote('not_helpful')}
          disabled={isSubmitting}
          className={`inline-flex items-center px-3 py-1 rounded border transition-colors ${
            currentVote === 'not_helpful'
              ? 'bg-red-100 text-red-700 border-red-300'
              : 'text-gray-600 border-gray-300 hover:bg-red-50 hover:text-red-600'
          } disabled:opacity-50`}
        >
          <ThumbsDown className="w-4 h-4 mr-1" />
          No ({notHelpfulCount})
        </button>
      </div>
    </div>
  );
};

export default ReviewVoting;