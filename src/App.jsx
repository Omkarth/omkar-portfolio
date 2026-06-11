import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Portfolio from "./Portfolio";

const Blog = lazy(() => import("./Blog"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/blog" element={<Suspense fallback={<div style={{ minHeight: "100vh", background: "#090c18" }} />}><Blog /></Suspense>} />
      </Routes>
    </BrowserRouter>
  );
}
