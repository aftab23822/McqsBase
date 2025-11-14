import React from 'react';
import { CheckCircle } from 'lucide-react';

const optionLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
function stripPrefix(option) {
  return option.replace(/^[A-Z][.、)] ?/i, '').trim();
}
function normalize(str) {
  return stripPrefix(str || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

const PastPaperMcqCard = ({
    question,
    options = [],
    correctAnswer,
    subject,
    year,
    department = "General",
    submittedBy = "Anonymous",
    detailsUrl = "#",
    questionNumber,
}) => {
    const normalizedCorrect = normalize(correctAnswer);
    
    // Check if there's a correct answer in the options
    const hasCorrectAnswer = options.some(option => 
      normalize(option) === normalizedCorrect
    );
    
    return (
        <div className="bg-white shadow-md rounded-lg p-4 space-y-4 w-full mx-auto border border-gray-100">
            
            {/* Question */}
            <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-500">
                <h2 className="text-base font-semibold text-gray-800 leading-relaxed">
                    <span className="inline-flex items-center justify-center w-10 h-6 bg-orange-500 text-white rounded-full text-xs font-bold mr-2">
                        {questionNumber}
                    </span>
                    {question}
                </h2>
            </div>

            {/* Options */}
            <div className="space-y-2">
                {options.map((option, index) => {
                    const label = optionLabels[index] || String.fromCharCode(65 + index);
                    const strippedOption = stripPrefix(option);
                    const isCorrect = normalize(option) === normalizedCorrect;
                    return (
                        <div
                            key={index}
                            className={`flex items-center space-x-3 p-2 rounded-md border ${
                                isCorrect 
                                    ? 'bg-green-50 border-green-200 text-green-800' 
                                    : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                        >
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCorrect 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-300 text-gray-600'
                            }`}>
                                {label}
                            </div>
                            <div className={`flex-1 text-sm leading-relaxed ${
                                isCorrect ? 'font-medium' : ''
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

            {/* Simple footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span className="font-medium text-gray-700">📅 Year: {year || 'N/A'}</span>
            <span className="font-medium text-gray-700">🏢 Department: {department || 'General'}</span>

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

export default PastPaperMcqCard;
