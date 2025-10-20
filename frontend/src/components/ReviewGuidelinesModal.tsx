import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ReviewGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'professor' | 'college';
}

const PROFESSOR_GUIDELINES = [
  "Be respectful and constructive in your feedback",
  "No vulgar language, personal attacks, or offensive content",
  "Focus on teaching quality, course content, and academic experience",
  "Do not reveal personal information about yourself or the professor",
  "Reviews containing hate speech, discrimination, or harassment will be removed",
  "Fake reviews or spam will result in account suspension",
  "Use appropriate language and maintain academic discourse",
  "Provide honest feedback that would help other students",
  "Reviews are anonymous by default to protect your privacy",
  "All reviews go through moderation before being published"
];

const COLLEGE_GUIDELINES = [
  "Be respectful and constructive in your feedback",
  "No vulgar language, personal attacks, or offensive content",
  "Focus on factual experiences with specific aspects (food, facilities, etc.)",
  "Do not reveal personal information about yourself or others",
  "Reviews containing hate speech, discrimination, or harassment will be removed",
  "Fake reviews or spam will result in account suspension",
  "Use appropriate language and maintain academic discourse",
  "Provide honest feedback that would help other students",
  "Reviews are anonymous - your identity will not be revealed",
  "All reviews go through moderation before being published"
];

export default function ReviewGuidelinesModal({ isOpen, onClose, type = 'professor' }: ReviewGuidelinesModalProps) {
  if (!isOpen) return null;

  const guidelines = type === 'professor' ? PROFESSOR_GUIDELINES : COLLEGE_GUIDELINES;
  const title = type === 'professor' ? 'Professor Review Guidelines' : 'College Review Guidelines';
  const description = type === 'professor' 
    ? 'Please read these guidelines before submitting your professor review'
    : 'Please read these guidelines before submitting your college review';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{description}</p>
          
          <ul className="space-y-3 mb-6">
            {guidelines.map((guideline, index) => (
              <li key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{guideline}</span>
              </li>
            ))}
          </ul>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Important Notice</h4>
            <p className="text-sm text-blue-700">
              {type === 'professor' 
                ? "Your reviews help other students make informed decisions about their courses and professors. Please be honest, fair, and constructive in your feedback."
                : "Your reviews help other students choose the right college for their education. Please provide honest, helpful feedback based on your actual experience."
              }
            </p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-yellow-900 mb-2">Privacy & Anonymity</h4>
            <p className="text-sm text-yellow-700">
              All reviews are anonymous by default. Your identity will never be revealed publicly. 
              However, administrators can see review authors for moderation purposes only.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}