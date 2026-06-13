"use client";
import React from "react";
import { useSession } from "next-auth/react";

const Header = () => {
  const { data: session } = useSession();
  const name = session?.user?.name || "User";
  const firstName = name.split(" ")[0];
  return (
    <h1 className="text-primary/90 text-3xl font-medium tracking-wide">
      what are we learning today, {firstName}?
    </h1>
  );
};

export default Header;
