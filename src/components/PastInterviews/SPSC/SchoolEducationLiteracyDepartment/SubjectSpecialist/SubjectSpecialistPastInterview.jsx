"use client";

import React, { useEffect, useState } from 'react';
import BasePastInterview from '../../../BasePastInterview';
import LoadingSpinner from '../../../../../components/LoadingSpinner';
import { apiFetch } from '../../../../../utils/api';

const interviewsPerPage = 10;

const SubjectSpecialistPastInterview = () => {
  const [pastInterviewData, setPastInterviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/interviews/subject-specialist?page=${currentPage}&limit=${interviewsPerPage}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setPastInterviewData(data.results);
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
  return <BasePastInterview pastInterviewData={pastInterviewData} title="Subject Specialist Past Interview"
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPages={totalPages}
      interviewsPerPage={interviewsPerPage}
    />
};

export default SubjectSpecialistPastInterview; 