"use client";
import * as React from "react";
import { SearchForm } from "@/components/ui/search-form";
import { VersionSwitcher } from "@/components/ui/version-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import SidebarFooterButton from "@/components/ui/sidebar-footer-button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
// This is sample data.
const data = {
  versions: ["Personal"],

  navMain: [
    {
      title: "RECENTS",
      url: "#",
      items: [
        {
          title: "Build a SaaS Landing Page",
          url: "#",
        },
        {
          title: "Fix Next.js Hydration Error",
          url: "#",
        },
        {
          title: "System Design: URL Shortener",
          url: "#",
        },
        {
          title: "Learn Redis Caching",
          url: "#",
        },
      ],
    },

    {
      title: "SPACES",
      url: "#",
      items: [
        {
          title: "Startup Ideas",
          url: "#",
        },
        {
          title: "Interview Prep",
          url: "#",
        },
        {
          title: "College Projects",
          url: "#",
        },
      ],
    },

    {
      title: "YOUR LIBRARY",
      url: "#",
      items: [
        {
          title: "Saved Prompts",
          url: "#",
        },
        {
          title: "Code Snippets",
          url: "#",
          isActive: true,
        },
        {
          title: "Research Notes",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="w-full">
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0] || "1.0.0"}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((group) => {
          const [open, setOpen] = React.useState(true);

          return (
            <Collapsible key={group.title} open={open} onOpenChange={setOpen}>
              <SidebarGroup>
                <SidebarGroupLabel>
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    <span>{group.title}</span>

                    <ChevronRight
                      className={`h-4 w-4 transition-all duration-300 ease-in-out ${
                        open ? "rotate-90" : ""
                      }`}
                    />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>

                <CollapsibleContent>
                  {" "}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            isActive={item.isActive}
                            className={cn(
                              "h-10 rounded-md transition-colors duration-200",
                              item.isActive
                                ? "text-white"
                                : "text-zinc-400 hover:text-zinc-300",
                            )}
                          >
                            <a href={item.url}>{item.title}</a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="h-fit w-full min-w-fit">
        <SidebarFooterButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
