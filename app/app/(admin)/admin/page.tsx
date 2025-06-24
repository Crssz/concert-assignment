import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Ticket, XCircle, Plus, BarChart3 } from "lucide-react";
import { getAdminDashboardStats } from "../loader";
import OverviewConcertCards from "./overview-concert-cards";
import { CreateConcertSection } from "./create-concert.section";

interface AdminPageProps {
  searchParams: Promise<{ page?: string; tab?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { tab: tabParam } = await searchParams;
  const activeTab = tabParam || "overview";
  
  const stats = await getAdminDashboardStats();

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Seats */}
        <Card className="bg-green-100/50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Total Seats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSeats.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all your concerts
            </p>
          </CardContent>
        </Card>

        {/* Total Reservations */}
        <Card className="bg-blue-100/50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Reserved Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Currently reserved seats
            </p>
          </CardContent>
        </Card>

        {/* Cancelled Reservations */}
        <Card className="bg-red-100/50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-500">Revoked Tickets</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCancelledReservations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Cancelled reservations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Concert Overview
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Concert
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <OverviewConcertCards searchParams={searchParams} />
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4">
          <div className="flex justify-center">
            <CreateConcertSection />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
