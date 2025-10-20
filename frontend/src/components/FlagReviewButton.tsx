import React, { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface FlagReviewButtonProps {
  reviewId: string;
  onFlagSubmitted?: () => void;
}

const FLAG_REASONS = [
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'spam', label: 'Spam' },
  { value: 'fake_review', label: 'Fake Review' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'off_topic', label: 'Off Topic' },
  { value: 'other', label: 'Other' },
];

const FlagReviewButton: React.FC<FlagReviewButtonProps> = ({ 
  reviewId, 
  onFlagSubmitted 
}) => {
  const { user, session } = useAuth();
  const { showToast } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFlag = async () => {
    if (!reason) {
      showToast('Please select a reason for flagging this review', 'warning');
      return;
    }

    setIsSubmitting(true);

    if (!user || !session) {
      showToast('Please log in to flag reviews', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/reviews/${reviewId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          reason,
          description: description.trim() || undefined,
        }),
      });

      if (response.ok) {
        showToast('Content flagged for review. Thank you!', 'success');
        
        // Reset form
        setReason('');
        setDescription('');
        setIsOpen(false);
        
        // Notify parent component
        if (onFlagSubmitted) {
          onFlagSubmitted();
        }
      } else {
        const errorData = await response.json();
        showToast(errorData.detail || 'Failed to flag review. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason('');
    setDescription('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-300"
      >
        <Flag className="w-4 h-4 mr-1" />
        Flag
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold">Flag Review</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Help us maintain a safe and respectful community by reporting inappropriate content.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Reason for flagging *
            </label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select a reason</option>
              {FLAG_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Additional details (optional)
            </label>
            <textarea
              placeholder="Please provide more details about why you're flagging this review..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              {description.length}/500 characters
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Before flagging:</p>
                <ul className="text-xs space-y-1">
                  <li>• Only flag content that violates our community guidelines</li>
                  <li>• Don't flag reviews just because you disagree with them</li>
                  <li>• False reports may result in restrictions on your account</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button 
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmitFlag}
            disabled={isSubmitting || !reason}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Flag'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlagReviewButton;