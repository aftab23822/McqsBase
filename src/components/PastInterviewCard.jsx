import React from 'react';
import { CheckCircle, User, Briefcase } from 'lucide-react';

const optionLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
function stripPrefix(option) {
  return option.replace(/^[A-Z][.、)] ?/i, '').trim();
}
function normalize(str) {
  return stripPrefix(str || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

const PastInterviewCard = ({
  question,
  options = [],
  correctAnswer,
  sharedBy = "Anonymous",
  position,
  department,
  year,
  experience = "Not provided"
}) => {
  const normalizedCorrect = normalize(correctAnswer);

  // Check if there's a correct answer in the options
  const hasCorrectAnswer = options.some(option =>
    normalize(option) === normalizedCorrect
  );

  return (
    <div className="bg-white shadow-md rounded-lg p-4 space-y-4 w-full mx-auto border border-gray-100">

      {/* Question */}
      <div className="bg-indigo-50 rounded-lg p-3 border-l-4 border-indigo-500">
        <h2 className="text-base font-semibold text-gray-800 leading-relaxed">
          <span className="inline-flex items-center justify-center w-10 h-6 bg-indigo-500 text-white rounded-full text-xs font-bold mr-2">
            Q
          </span>
          {question}
        </h2>
      </div>

      {/* Render options if present */}
      {Array.isArray(options) && options.length > 0 && correctAnswer ? (
        <div className="space-y-2">
          {options.map((option, index) => {
            const label = optionLabels[index] || String.fromCharCode(65 + index);
            const strippedOption = stripPrefix(option);
            const isCorrect = normalize(option) === normalizedCorrect;
            return (
              <div
                key={index}
                className={`flex items-center space-x-3 p-2 rounded-md border ${isCorrect
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
              >
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                  }`}>
                  {label}
                </div>
                <div className={`flex-1 text-sm leading-relaxed ${isCorrect ? 'font-medium' : ''
                  }`}>
                  {strippedOption}
                </div>
                {isCorrect && (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Interview Details */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-3 h-3 text-indigo-500" />
            <span className="text-gray-600">{position}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-3 h-3 text-green-500" />
            <span className="text-gray-600">By: {sharedBy}</span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-2">
          <div className="text-xs text-gray-600 leading-relaxed">
            <span className="font-normal text-gray-600">👁️‍🗨️ Experience: {experience}</span>
            
          </div>
        </div>
      </div>

      {/* Simple footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span className="font-medium text-gray-700">📅 Year: {year}</span>
        <span className="font-medium text-gray-700">🏢 Department: {department}</span>
        {hasCorrectAnswer && (
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span className="text-green-600">Correct</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PastInterviewCard;