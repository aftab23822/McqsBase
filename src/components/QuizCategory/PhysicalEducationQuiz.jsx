"use client";

import React, { useEffect, useState } from 'react';
import BaseQuiz from './BaseQuiz';
import LoadingSpinner from '../LoadingSpinner';
import { apiFetch } from '../../utils/api';
import { usePageFromUrl } from '../../hooks/usePageFromUrl';

const quizPerPage = 10;

const PhysicalEducationQuiz = () => {
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    // Initialize currentPage from URL or default to 1
  const initialPage = usePageFromUrl();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/quiz/physical-education?page=${currentPage}&limit=${quizPerPage}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setQuizData(data.results);
        setTotalPages(data.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [currentPage]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;
  return (
    <BaseQuiz
      quizData={quizData}
      title="Physical Education Quiz"
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPages={totalPages}
      quizPerPage={quizPerPage}
    />
  );
};

export default PhysicalEducationQuiz; 