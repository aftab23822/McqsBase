"use client";

import React, { useEffect, useState } from 'react';
import BaseQuiz from './BaseQuiz';
import LoadingSpinner from '../LoadingSpinner';
import { apiFetch } from '../../utils/api';

const quizPerPage = 10;

const SociologyQuiz = () => {
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/quiz/sociology?page=${currentPage}&limit=${quizPerPage}`)
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
      title="Sociology Quiz"
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPages={totalPages}
      quizPerPage={quizPerPage}
    />
  );
};

export default SociologyQuiz; 