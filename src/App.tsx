import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Home from "./pages/Home";
import NovelList from "./pages/NovelList";
import Search from "./pages/Search";
import Ranking from "./pages/Ranking";
import About from "./pages/About";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import RequestPage from "./pages/request";
import ReadPage from "./pages/read/[slug]";
import ConsolePage from "./pages/console"; // ✅ Add this import

const queryClient = new QueryClient();

console.log("App.tsx loading...");

const App = () => {
  console.log("App component rendering...");
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/novel-list" element={<NovelList />} />
              <Route path="/search" element={<Search />} />
              <Route path="/ranking/:type" element={<Ranking />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/random" element={<Home />} />
              <Route path="/recommendations" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/*" element={<Profile />} />
              <Route path="/request" element={<RequestPage />} />
              <Route path="/read/:slug" element={<ReadPage />} />
              <Route path="/console" element={<ConsolePage />} /> {/* ✅ Add this route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
