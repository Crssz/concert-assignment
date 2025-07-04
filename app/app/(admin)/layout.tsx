import type { Metadata } from "next";

import {
  Sidebar,
  SidebarFooter,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { getSessionData, logoutAction } from "../(common)/auth-actions";
import { Button } from "@/components/ui/button";
import { AdminSideMenu } from "./admin-side-menu";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Concert Reservation Platform - Admin",
  description: "Concert Reservation Platform - Admin",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionData = await getSessionData();
  if (!sessionData.isLoggedIn) {
    return redirect("/");
  }
  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <h1 className="text-lg font-bold lg:text-2xl">Admin</h1>
        </SidebarHeader>
        <SidebarContent>
          <AdminSideMenu />
        </SidebarContent>
        <SidebarFooter>
          <Button
            variant="outline"
            className={cn(
              "hover:bg-rose-500 hover:text-white",
              "hover:border-rose-500",
            )}
            onClick={logoutAction}
          >
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>
      <main className="w-full">
        <SidebarTrigger className="lg:hidden" />
        {children}
      </main>
    </>
  );
}
