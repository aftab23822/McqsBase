"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BasePastInterview from "@/components/PastInterviews/BasePastInterview";
import PastInterviewsRightSideBar from "@/components/PastInterviewsRightSideBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import SubcategoriesSection from "@/components/SubcategoriesSection";
import SubcategoriesGrid from "@/components/SubcategoriesGrid";
import { apiFetch } from "@/utils/api";

const interviewsPerPage = 10;

function convertSubcategoriesToTree(subcategories, basePath = "") {
  if (!subcategories || subcategories.length === 0) return [];

  return subcategories.map((subcat, index) => {
    let slug =
      subcat.slug ||
      subcat.label
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

    const fullSlug = basePath ? `${basePath}/${slug}` : slug;

    return {
      _id: `subcat-${index}-${slug}`,
      name: subcat.label,
      slug,
      fullSlug,
      children: convertSubcategoriesToTree(subcat.subcategories || [], fullSlug),
    };
  });
}

export default function PastInterviewDepartmentPage() {
  const params = useParams();
  const { commission, department } = params;

  const [pastInterviewData, setPastInterviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [breadcrumbData, setBreadcrumbData] = useState({
    commissionLabel: "",
    departmentLabel: "",
  });
  const [departmentNode, setDepartmentNode] = useState(null);
  const departmentTopics = useMemo(() => {
    const labels = new Set();
    (pastInterviewData || []).forEach((item) => {
      if (item && item.department) {
        const clean = String(item.department)
          .replace(/^[^\w\s]+/, "")
          .trim();
        if (clean) {
          labels.add(clean);
        }
      }
    });
    return Array.from(labels);
  }, [pastInterviewData]);

  const topicsTree = useMemo(() => {
    return departmentTopics.map((label, index) => {
      const slug = label
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
      return {
        _id: `topic-${index}-${slug}`,
        name: label,
        slug,
        fullSlug: slug,
        children: []
      };
    });
  }, [departmentTopics]);

  const filteredInterviews = useMemo(() => {
    if (!selectedTopic) return pastInterviewData;
    return (pastInterviewData || []).filter((item) => {
      const dept = String(item.department || '')
        .replace(/^[^\w\s]+/, '')
        .trim()
        .toLowerCase();
      return dept === selectedTopic.toLowerCase();
    });
  }, [pastInterviewData, selectedTopic]);

  useEffect(() => {
    setCurrentPage(1);
    setPastInterviewData([]);
    setError(null);
  }, [commission, department]);

  useEffect(() => {
    const fetchInterviews = async () => {
      if (!commission || !department) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // role = "all" means filter only by department on the API side
        const response = await apiFetch(
          `/api/interviews/${commission}/${department}/all?page=${currentPage}&limit=${interviewsPerPage}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        setPastInterviewData(data.results || []);
        setTotalPages(data.totalPages || 1);

        const structRes = await fetch('/api/categories/structure?type=past-interviews');
        const structJson = await structRes.json();
        const categories =
          structJson.success && Array.isArray(structJson.data?.commissions)
            ? structJson.data.commissions
            : [];
        const foundCommission = categories.find((cat) => {
          const catSlug = cat.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
          return catSlug === commission;
        });

        if (foundCommission) {
          const foundDepartment = foundCommission.departments?.find((dept) => {
            const deptSlug = dept.label
              .replace(/^[^\w\s]+/, "")
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-+|-+$/g, "");
            return deptSlug === department;
          });

          if (foundDepartment) {
            setDepartmentNode(foundDepartment);
            setBreadcrumbData({
              commissionLabel: foundCommission.title,
              departmentLabel: foundDepartment.label.replace(/^[^\w\s]+/, ""),
            });
          } else {
            setBreadcrumbData({
              commissionLabel: foundCommission.title,
              departmentLabel: department
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()),
            });
          }
        } else {
          setBreadcrumbData({
            commissionLabel: commission
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            departmentLabel: department
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
          });
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching past interviews (department):", err);
        setError(err.message || "Failed to load past interviews");
        setPastInterviewData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [commission, department, currentPage]);

  const subcategoriesTree = useMemo(() => {
    if (!departmentNode || !departmentNode.subcategories) return [];
    return convertSubcategoriesToTree(departmentNode.subcategories, "");
  }, [departmentNode]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </>
    );
  }

  if (error || !pastInterviewData || pastInterviewData.length === 0) {
    return (
      <>
        <Navbar />
        <section className="full-screen px-4 py-8 bg-gray-100">
          <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="col-span-2 p-6 rounded-lg">
              <nav className="mb-6 text-sm text-gray-600">
                <div className="md:hidden flex items-center space-x-1 overflow-hidden">
                  <Link
                    href="/"
                    className="hover:text-blue-600 whitespace-nowrap"
                  >
                    Home
                  </Link>
                  <span className="text-gray-400">›</span>
                  <Link
                    href="/past-interviews"
                    className="hover:text-blue-600 whitespace-nowrap"
                  >
                    Past Interviews
                  </Link>
                  {breadcrumbData.departmentLabel && (
                    <>
                      <span className="text-gray-400">›</span>
                      <span
                        className="text-gray-800 truncate"
                        title={breadcrumbData.departmentLabel}
                      >
                        {breadcrumbData.departmentLabel}
                      </span>
                    </>
                  )}
                </div>
                <div className="hidden md:flex items-center space-x-2">
                  <Link href="/" className="hover:text-blue-600">
                    Home
                  </Link>
                  <span className="text-gray-400">/</span>
                  <Link
                    href="/past-interviews"
                    className="hover:text-blue-600"
                  >
                    Past Interviews
                  </Link>
                  {breadcrumbData.departmentLabel && (
                    <>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-800">
                        {breadcrumbData.departmentLabel}
                      </span>
                    </>
                  )}
                </div>
              </nav>
              <h1 className="text-2xl font-bold mb-4 text-gray-800">
                Past Interview Questions — {breadcrumbData.departmentLabel}
              </h1>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">
                  {error
                    ? `Error: ${error}`
                    : "No past interview questions found for this department yet."}
                </p>
              </div>
            </div>
            <div className="col-span-1">
              <PastInterviewsRightSideBar />
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      {currentPage === 1 && topicsTree.length > 0 && (
        <SubcategoriesGrid
          subject={breadcrumbData.departmentLabel || department}
          tree={topicsTree}
          basePath="past-interviews"
          disableAllLinks
          onSelectItem={(node) => setSelectedTopic(node.name)}
        />
      )}
      {currentPage === 1 && subcategoriesTree.length > 0 && (
        <div className="bg-gray-100">
          <div className="max-w-screen-xl mx-auto px-4 py-8">
            <SubcategoriesSection
              subject={breadcrumbData.departmentLabel || department}
              initialTree={subcategoriesTree}
              basePath={`past-interviews/${commission}/${department}`}
            />
          </div>
        </div>
      )}
      <section className="full-screen px-4 py-8 bg-gray-100">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="col-span-2">
            <nav className="mb-6 text-sm text-gray-600">
              <div className="md:hidden flex items-center space-x-1 overflow-hidden">
                <Link
                  href="/"
                  className="hover:text-blue-600 whitespace-nowrap"
                >
                  Home
                </Link>
                <span className="text-gray-400">›</span>
                <Link
                  href="/past-interviews"
                  className="hover:text-blue-600 whitespace-nowrap"
                >
                  Past Interviews
                </Link>
                {breadcrumbData.departmentLabel && (
                  <>
                    <span className="text-gray-400">›</span>
                    <span
                      className="text-gray-800 truncate"
                      title={breadcrumbData.departmentLabel}
                    >
                      {breadcrumbData.departmentLabel}
                    </span>
                  </>
                )}
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/" className="hover:text-blue-600">
                  Home
                </Link>
                <span className="text-gray-400">/</span>
                <Link href="/past-interviews" className="hover:text-blue-600">
                  Past Interviews
                </Link>
                {breadcrumbData.departmentLabel && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-800">
                      {breadcrumbData.departmentLabel}
                    </span>
                  </>
                )}
              </div>
            </nav>
            <BasePastInterview
              pastInterviewData={filteredInterviews}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              interviewsPerPage={interviewsPerPage}
            />
          </div>
          <div className="col-span-1">
            <PastInterviewsRightSideBar />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

