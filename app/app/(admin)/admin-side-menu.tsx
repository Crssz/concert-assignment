"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { RefreshCwIcon, History, LayoutDashboard } from "lucide-react";
import { redirect } from "next/navigation";

export function AdminSideMenu() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => redirect("/admin")}>
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => redirect("/admin/reservation-history")}>
          <History className="w-4 h-4" /> Reservation History
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => redirect("/user")}>
          <RefreshCwIcon className="w-4 h-4" /> Switch to User
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
