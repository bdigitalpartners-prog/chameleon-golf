"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { CourseCard } from "@/types";

interface CompareContextValue {
  courses: CourseCard[];
  addCourse: (course: CourseCard) => void;
  removeCourse: (courseId: number) => void;
  clearAll: () => void;
  isInCompare: (courseId: number) => boolean;
}

const CompareContext = createContext<CompareContextValue>({
  courses: [],
  addCourse: () => {},
  removeCourse: () => {},
  clearAll: () => {},
  isInCompare: () => false,
});

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<CourseCard[]>([]);

  const addCourse = useCallback((course: CourseCard) => {
    setCourses((prev) => {
      if (prev.length >= 4) return prev;
      if (prev.some((c) => c.courseId === course.courseId)) return prev;
      return [...prev, course];
    });
  }, []);

  const removeCourse = useCallback((courseId: number) => {
    setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
  }, []);

  const clearAll = useCallback(() => {
    setCourses([]);
  }, []);

  const isInCompare = useCallback(
    (courseId: number) => courses.some((c) => c.courseId === courseId),
    [courses]
  );

  return (
    <CompareContext.Provider value={{ courses, addCourse, removeCourse, clearAll, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
