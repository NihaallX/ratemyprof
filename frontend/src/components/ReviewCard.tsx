import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, BookOpen, Shield } from 'lucide-react';
import ReviewVoting from './ReviewVoting';
import FlagReviewButton from './FlagReviewButton';

interface ReviewProps {
  id: string;
  // Removed: author (all reviews are anonymous)
  verifiedStudent?: boolean; // All reviews from verified students
  ratings: {
    overall: number;
    difficulty: number;
    clarity: number;
    helpfulness: number;
  };
  wouldTakeAgain: boolean;
  reviewText?: string;
  courseInfo: {
    name?: string;
    semester?: string;
    year?: number;
    grade?: string;
  };
  tags?: string[];
  createdAt: string;
  helpfulCount: number;
  notHelpfulCount: number;
  userVote?: 'helpful' | 'not_helpful' | null;
  canFlag?: boolean;
  onVoteUpdate?: (newCounts: { helpful: number; notHelpful: number }) => void;
  onFlagSubmitted?: () => void;
}

const ReviewCard: React.FC<ReviewProps> = ({
  id,
  verifiedStudent = true, // All reviews are from verified students
  ratings,
  wouldTakeAgain,
  reviewText,
  courseInfo,
  tags = [],
  createdAt,
  helpfulCount,
  notHelpfulCount,
  userVote,
  canFlag = true,
  onVoteUpdate,
  onFlagSubmitted,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return 'Easy';
    if (difficulty <= 3) return 'Moderate';
    if (difficulty <= 4) return 'Hard';
    return 'Very Hard';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800';
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800';
    if (difficulty <= 4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {renderStars(ratings.overall)}
              <span className={`ml-2 font-semibold ${getRatingColor(ratings.overall)}`}>
                {ratings.overall}/5
              </span>
            </div>
            
            <Badge variant={wouldTakeAgain ? 'default' : 'destructive'}>
              {wouldTakeAgain ? 'Would take again' : 'Would not take again'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{formatDate(createdAt)}</span>
            {canFlag && <FlagReviewButton reviewId={id} onFlagSubmitted={onFlagSubmitted} />}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {/* Verified Student Badge - All reviews are anonymous */}
          {verifiedStudent && (
            <div className="inline-flex items-center px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-medium">
              <Shield className="w-3 h-3 mr-1" />
              Verified Student
            </div>
          )}
          
          {courseInfo.name && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {courseInfo.name}
            </div>
          )}
          
          {courseInfo.semester && courseInfo.year && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {courseInfo.semester} {courseInfo.year}
            </div>
          )}
          
          {courseInfo.grade && (
            <Badge variant="outline">Grade: {courseInfo.grade}</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Rating Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Clarity:</span>
            <div className="flex items-center gap-1">
              {renderStars(ratings.clarity)}
              <span className={getRatingColor(ratings.clarity)}>
                {ratings.clarity}/5
              </span>
            </div>
          </div>
          
          <div>
            <span className="text-gray-600">Helpfulness:</span>
            <div className="flex items-center gap-1">
              {renderStars(ratings.helpfulness)}
              <span className={getRatingColor(ratings.helpfulness)}>
                {ratings.helpfulness}/5
              </span>
            </div>
          </div>
          
          <div>
            <span className="text-gray-600">Difficulty:</span>
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(ratings.difficulty)}>
                {getDifficultyLabel(ratings.difficulty)}
              </Badge>
              <span className="text-gray-500">({ratings.difficulty}/5)</span>
            </div>
          </div>
        </div>
        
        {/* Review Text */}
        {reviewText && (
          <div>
            <p className="text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg">
              "{reviewText}"
            </p>
          </div>
        )}
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Voting Component */}
        <div className="border-t pt-4">
          <ReviewVoting
            reviewId={id}
            helpfulCount={helpfulCount}
            notHelpfulCount={notHelpfulCount}
            userVote={userVote}
            onVoteUpdate={onVoteUpdate}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;