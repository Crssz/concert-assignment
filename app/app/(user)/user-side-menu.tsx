"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HomeIcon, RefreshCwIcon, TicketIcon, History } from "lucide-react";
import { redirect } from "next/navigation";

export function UserSideMenu() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => redirect("/user")}>
          <HomeIcon /> Concert
        </SidebarMenuButton>
        <SidebarMenuButton onClick={() => redirect("/user/seats")}>
          <TicketIcon className="w-4 h-4" /> Your Seat
        </SidebarMenuButton>
        <SidebarMenuButton onClick={() => redirect("/user/history")}>
          <History className="w-4 h-4" /> History
        </SidebarMenuButton>
        <SidebarMenuButton onClick={() => redirect("/admin")}>
          <RefreshCwIcon className="w-4 h-4" /> Switch to Admin
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
