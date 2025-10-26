"use client";

import React, { useEffect, useState } from 'react';
import BasePastPaper from '../../../BasePastPaper';
import LoadingSpinner from '../../../../../components/LoadingSpinner';
import { apiFetch } from '../../../../../utils/api';

const mcqsPerPage = 10;
const LecturerFemalePastPaper = () => {
  const [pastpaperData, setPastpaperData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/pastpapers/lecturer-female?page=${currentPage}&limit=${mcqsPerPage}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setPastpaperData(data.results);
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
  return <BasePastPaper pastpaperData={pastpaperData} title="Lecturer (Female) Past Paper"
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPages={totalPages}
      mcqsPerPage={mcqsPerPage}
    />
};

export default LecturerFemalePastPaper; 