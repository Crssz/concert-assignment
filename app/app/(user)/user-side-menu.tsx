"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { RefreshCwIcon } from "lucide-react";
import { redirect } from "next/navigation";

export function UserSideMenu() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => redirect("/admin")}>
          <RefreshCwIcon className="w-4 h-4" /> Switch to Admin
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
