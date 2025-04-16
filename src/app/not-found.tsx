'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'

const NotFoundContent = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-3xl font-medium text-gray-600 mb-8">הדף לא נמצא</h2>
      <p className="text-lg text-gray-500 mb-8">
        אופס! נראה שהדף שחיפשת לא קיים.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
      >
        חזרה לדף הבית
      </Link>
    </div>
  )
}

export default function NotFound() {
  return (
    <Suspense fallback={<div>טוען...</div>}>
      <NotFoundContent />
    </Suspense>
  )
} 