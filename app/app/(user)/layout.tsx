import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger
} from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { getSessionData, logoutAction } from "../(common)/auth-actions";
import { UserSideMenu } from "./user-side-menu";

export const metadata: Metadata = {
  title: "Concert Reservation Platform - User",
  description: "Concert Reservation Platform - User",
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
          <h1 className="text-lg font-bold lg:text-2xl">
            User {sessionData.user?.firstName}
          </h1>
        </SidebarHeader>
        <SidebarContent>
          <UserSideMenu />
        </SidebarContent>
        <SidebarFooter>
          <Button variant="outline" onClick={logoutAction}>
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
