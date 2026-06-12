"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Switch } from "./switch";
import { useTheme } from "next-themes";

const SidebarFooterButton = () => {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);

  //console.log(session);

  return (
    <div>
      <DropdownMenu
        open={open}
        onOpenChange={(v) => {
          console.log("menu:", v);

          setOpen(v);
        }}
      >
        <DropdownMenuTrigger className="w-full">
          <button className="ring-offset-background hover:text-accent-foreground border-primary/10 hover:bg-primary/5 dark:border-primary/20 dark:hover:bg-primary/10 inline-flex h-fit w-full items-center justify-between truncate rounded-md border bg-white px-3 py-3 text-left text-sm font-medium whitespace-nowrap shadow-sm transition-colors duration-200 ease-in-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:bg-transparent">
            <div className="flex min-w-0 flex-1 items-center">
              <span className="border-primary/10 dark:border-primary/20 relative mr-4 flex h-6 w-6 shrink-0 overflow-hidden rounded-full border">
                <Image
                  src={session?.user?.image || "/default-avatar.png"}
                  alt="User avatar"
                  width={24}
                  height={24}
                />
              </span>
              <div className="ml-[-3] flex min-w-0 flex-1 flex-col">
                <p className="font-sm truncate text-xs leading-tight">
                  {session?.user?.name}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`ml-2 h-4 w-4 transition-all duration-300 ease-in-out ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-md">
          <DropdownMenuItem>
            <div className="relative flex h-6 w-full cursor-pointer items-center space-x-3 rounded-lg px-1.5 py-1 text-xs transition-colors outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem className="border-t">
            <div className="relative flex h-6 w-full cursor-pointer items-center space-x-3 rounded-lg px-1.5 py-1 text-xs transition-colors outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SidebarFooterButton;
