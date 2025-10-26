"use client";

import React, { useEffect, useState } from 'react';
import BaseMcqs from './BaseMcqs';
import LoadingSpinner from '../LoadingSpinner';
import { apiFetch } from '../../utils/api';

const mcqsPerPage = 10;

const EconomicsMcqs = () => {
  const [mcqsData, setMcqsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/mcqs/economics?page=${currentPage}&limit=${mcqsPerPage}`)
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
      title="Economics MCQs"
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPages={totalPages}
      mcqsPerPage={mcqsPerPage}
    />
  );
};

export default EconomicsMcqs; 