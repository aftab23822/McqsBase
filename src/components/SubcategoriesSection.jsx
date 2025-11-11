"use client";

import React, { useEffect, useState } from 'react';
import SubcategoriesGrid from './SubcategoriesGrid';

export default function SubcategoriesSection({ subject, initialTree, basePath = 'mcqs' }) {
  const [tree] = useState(Array.isArray(initialTree) ? initialTree : []);
  const [loaded] = useState(Array.isArray(initialTree));

  useEffect(() => {}, [subject, initialTree]);

  if (!loaded) return null;
  if (!Array.isArray(tree) || tree.length === 0) return null;
  return <SubcategoriesGrid subject={subject} tree={tree} basePath={basePath} />;
}


