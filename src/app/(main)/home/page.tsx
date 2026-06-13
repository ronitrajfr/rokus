import React from "react";
import Dashboard from "@/app/_components/home/dashboard";

const Home = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-primary/90 text-3xl font-medium tracking-wide">
        See what Rokus can do
      </h1>

      <div className="w-full max-w-xl">
        <Dashboard />
      </div>
    </div>
  );
};

export default Home;
