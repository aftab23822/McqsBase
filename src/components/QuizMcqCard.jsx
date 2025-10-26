"use client";

import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const optionLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
function stripPrefix(option) {
  return option.replace(/^[A-Z][.、)] ?/i, '').trim();
}
function normalize(str) {
  return stripPrefix(str || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

const QuizMcqCard = ({
  question,
  options = [],
  correctAnswer,
  questionNumber,
  onAnswer,
  disabled,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const normalizedCorrect = normalize(correctAnswer);

  const handleOptionClick = (option) => {
    if (disabled || selectedOption !== null) return;
    setSelectedOption(option);
    onAnswer(question, option, correctAnswer);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 space-y-4 w-full mx-auto border border-gray-100">
      
      {/* Question */}
      <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-500">
        <h2 className="text-base font-semibold text-gray-800 leading-relaxed">
          <span className="inline-flex items-center justify-center w-10 h-6 bg-purple-500 text-white rounded-full text-xs font-bold mr-2">
            {questionNumber}
          </span>
          {question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option, idx) => {
          const label = optionLabels[idx] || String.fromCharCode(65 + idx);
          const strippedOption = stripPrefix(option);
          const isCorrect = normalize(option) === normalizedCorrect;
          const isSelected = option === selectedOption;
          
          let optionClass = "flex items-center space-x-3 p-2 rounded-md border cursor-pointer";
          let iconClass = "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold";
          let textClass = "flex-1 text-sm leading-relaxed";
          let icon = null;

          if (selectedOption !== null) {
            if (isCorrect) {
              optionClass += " bg-green-50 border-green-200 text-green-800";
              iconClass += " bg-green-500 text-white";
              textClass += " font-medium";
              icon = <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
            } else if (isSelected) {
              optionClass += " bg-red-50 border-red-200 text-red-800";
              iconClass += " bg-red-500 text-white";
              textClass += " font-medium";
              icon = <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
            } else {
              optionClass += " bg-gray-50 border-gray-200 text-gray-500 opacity-70";
              iconClass += " bg-gray-300 text-gray-500";
            }
          } else {
            optionClass += " bg-gray-50 border-gray-200 text-gray-700";
            iconClass += " bg-gray-300 text-gray-600";
          }

          return (
            <div
              key={idx}
              className={optionClass}
              onClick={() => handleOptionClick(option)}
            >
              <div className={iconClass}>
                {label}
              </div>
              <div className={textClass}>
                {strippedOption}
              </div>
              {icon}
            </div>
          );
        })}
      </div>

      {/* Simple Status */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span>
          {selectedOption 
            ? (normalize(selectedOption) === normalizedCorrect ? "Correct!" : "Incorrect") 
            : "Select your answer"
          }
        </span>
        {selectedOption && (
          <div className={`flex items-center space-x-1 ${
            normalize(selectedOption) === normalizedCorrect ? "text-green-600" : "text-red-600"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              normalize(selectedOption) === normalizedCorrect ? "bg-green-500" : "bg-red-500"
            }`}></div>
            <span className="font-medium">
              {normalize(selectedOption) === normalizedCorrect ? "Correct" : "Wrong"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizMcqCard;
