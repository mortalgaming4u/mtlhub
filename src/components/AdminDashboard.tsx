import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  FileText, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Crown,
  BookOpen
} from "lucide-react";

interface AdminDashboardProps {
  userId: string;
}

interface Request {
  id: string;
  url: string;
  title: string | null;
  status: string;
  ticket_cost: number;
  created_at: string;
  profiles: {
    username: string | null;
    display_name: string | null;
  };
}

interface Report {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  profiles: {
    username: string | null;
    display_name: string | null;
  };
}

interface Contribution {
  id: string;
  type: string;
  content: string;
  status: string;
  xp_reward: number;
  created_at: string;
  profiles: {
    username: string | null;
    display_name: string | null;
  };
}

export const AdminDashboard = ({ userId }: AdminDashboardProps) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
  }, [userId]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      
      const userIsAdmin = data?.role === 'admin' || data?.role === 'moderator';
      setIsAdmin(userIsAdmin);
      
      if (userIsAdmin) {
        fetchData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch pending requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("requests")
        .select(`
          *,
          profiles!requests_user_id_fkey(username, display_name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // Fetch open reports
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select(`
          *,
          profiles!reports_user_id_fkey(username, display_name)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);

      // Fetch pending contributions
      const { data: contributionsData, error: contributionsError } = await supabase
        .from("contributions")
        .select(`
          *,
          profiles!contributions_user_id_fkey(username, display_name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (contributionsError) throw contributionsError;
      setContributions(contributionsData || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("requests")
        .update({ status })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status })
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Report ${status} successfully`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update report",
        variant: "destructive",
      });
    }
  };

  const updateContributionStatus = async (contributionId: string, status: string) => {
    try {
      const contribution = contributions.find(c => c.id === contributionId);
      if (!contribution) return;

      const { error } = await supabase
        .from("contributions")
        .update({ 
          status,
          xp_reward: status === 'approved' ? 25 : 0
        })
        .eq("id", contributionId);

      if (error) throw error;

      // If approved, award XP to the user
      if (status === 'approved') {
        const userIdFromProfiles = await supabase
          .from("contributions")
          .select("user_id")
          .eq("id", contributionId)
          .single();

        if (userIdFromProfiles.data) {
          await supabase.rpc("award_xp", {
            _user_id: userIdFromProfiles.data.user_id,
            _xp_amount: 25
          });
        }
      }

      toast({
        title: "Success",
        description: `Contribution ${status} successfully`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update contribution",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading admin dashboard...</div>;
  }

  if (!isAdmin) {
    return (
      <Card className="bg-gradient-card border-0 shadow-card">
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to access the admin dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Crown className="h-8 w-8 text-accent" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Requests ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="contributions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contributions ({contributions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader>
              <CardTitle>Pending Novel Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending requests
                </p>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-muted/30 rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {request.profiles?.display_name || request.profiles?.username || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground break-all">
                            {request.url}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                          {request.ticket_cost > 0 && (
                            <Badge variant="outline">
                              {request.ticket_cost} tickets
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, "approved")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateRequestStatus(request.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader>
              <CardTitle>Open Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No open reports
                </p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 bg-muted/30 rounded-lg space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{report.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            by {report.profiles?.display_name || report.profiles?.username || "Unknown User"}
                          </span>
                        </div>
                        <p className="text-sm">{report.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateReportStatus(report.id, "resolved")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateReportStatus(report.id, "in_progress")}
                        >
                          In Progress
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateReportStatus(report.id, "dismissed")}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributions">
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader>
              <CardTitle>Pending Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              {contributions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending contributions
                </p>
              ) : (
                <div className="space-y-4">
                  {contributions.map((contribution) => (
                    <div
                      key={contribution.id}
                      className="p-4 bg-muted/30 rounded-lg space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{contribution.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            by {contribution.profiles?.display_name || contribution.profiles?.username || "Unknown User"}
                          </span>
                        </div>
                        <p className="text-sm">{contribution.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(contribution.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateContributionStatus(contribution.id, "approved")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve (+25 XP)
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateContributionStatus(contribution.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};