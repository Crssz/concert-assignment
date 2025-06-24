"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { RefreshCwIcon } from "lucide-react";
import { redirect } from "next/navigation";

export function AdminSideMenu() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => redirect("/user")}>
          <RefreshCwIcon className="w-4 h-4" /> Switch to User
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
