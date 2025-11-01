"use client";

import React, { useEffect, useState } from 'react';
import BaseMcqs from './BaseMcqs';
import LoadingSpinner from '../LoadingSpinner';
import { apiFetch } from '../../utils/api';
import { usePageFromUrl } from '../../hooks/usePageFromUrl';

const mcqsPerPage = 10;

const SociologyMcqs = () => {
  const [mcqsData, setMcqsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    // Initialize currentPage from URL or default to 1
  const initialPage = usePageFromUrl();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/mcqs/sociology?page=${currentPage}&limit=${mcqsPerPage}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setMcqsData(data.results);
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
    <BaseMcqs
      mcqsData={mcqsData}
      title="Sociology MCQs"
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPages={totalPages}
      mcqsPerPage={mcqsPerPage}
    />
  );
};

export default SociologyMcqs; 