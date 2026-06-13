import React from "react";
import Dashboard from "@/app/_components/home/dashboard";
import Header from "@/app/_components/home/hearder";

const Home = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-4">
      <Header />
      <div className="w-full max-w-xl">
        <Dashboard />
      </div>
    </div>
  );
};

export default Home;
