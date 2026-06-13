import React from "react";
import Cards from "./cards";
import { PromptInputWithActions } from "./ai-textarea";

const Dashboard = () => {
  return (
    <div className="mb-24 space-y-4">
      <Cards />
      <PromptInputWithActions />
    </div>
  );
};

export default Dashboard;
