import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface NovelRequestProps {
  userId: string;
}

interface Request {
  id: string;
  url: string;
  title: string | null;
  status: string;
  ticket_cost: number;
  notes: string | null;
  created_at: string;
}

interface UserQuota {
  weekly_requests_used: number;
  tickets: number;
  last_request_reset: string;
}

const WEEKLY_LIMIT = 3;
const BASE_TICKET_COST = 100;

const SUPPORTED_DOMAINS = [
  "fanqienovel.com",
  "qimao.com",
  "uuread.tw",
  "69shuba.com",
  "twkan.com",
  "wenku8.net",
  "lightnovel.us",
  "boxnovel.com",
  "readlightnovel.org",
  "novelfull.com",
];

export const NovelRequest = ({ userId }: NovelRequestProps) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [preview, setPreview] = useState<{ title: string; cover_url?: string } | null>(null);
  const [quota, setQuota] = useState<UserQuota>({
    weekly_requests_used: 0,
    tickets: 0,
    last_request_reset: new Date().toISOString(),
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
    fetchUserQuota();
  }, [userId]);

  // 🔁 Poll requests every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // 🔎 Metadata preview (debounced)
  useEffect(() => {
    const fetchPreview = async () => {
      if (!validateUrl(url)) return setPreview(null);
      try {
        const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        setPreview(data);
      } catch {
        setPreview(null);
      }
    };
    const debounce = setTimeout(fetchPreview, 800);
    return () => clearTimeout(debounce);
  }, [url]);

  const fetchUserQuota = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("weekly_requests_used, tickets, last_request_reset")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      if (data) setQuota(data);
    } catch (error) {
      console.error("Error fetching user quota:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const validateUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return SUPPORTED_DOMAINS.some((domain) =>
        urlObj.hostname.includes(domain)
      );
    } catch {
      return false;
    }
  };

  const calculateTicketCost = () => {
    if (quota.weekly_requests_used < WEEKLY_LIMIT) return 0;
    const extraRequests = quota.weekly_requests_used - WEEKLY_LIMIT + 1;
    return BASE_TICKET_COST * Math.pow(2, extraRequests - 1);
  };

  const submitRequest = async () => {
    if (!url.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid novel URL",
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(url)) {
      toast({
        title: "Unsupported Domain",
        description:
          "This domain is not supported. Please check the supported domains list.",
        variant: "destructive",
      });
      return;
    }

    const ticketCost = calculateTicketCost();
    if (ticketCost > quota.tickets) {
      toast({
        title: "Insufficient Tickets",
        description: `You need ${ticketCost} tickets for this request but only have ${quota.tickets}.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create the request with title preview
      const { error: requestError } = await supabase.from("requests").insert({
        user_id: userId,
        url: url.trim(),
        title: preview?.title || null,
        ticket_cost: ticketCost,
      });

      if (requestError) throw requestError;

      // 🔁 Trigger backend ingestion
      await fetch("/api/process");

      // Update user quota and tickets
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          weekly_requests_used: quota.weekly_requests_used + 1,
          tickets: quota.tickets - ticketCost,
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Award XP
      await supabase.rpc("award_xp", {
        _user_id: userId,
        _xp_amount: 10,
      });

      toast({
        title: "Request Submitted",
        description: `Your novel request has been submitted${
          ticketCost > 0 ? ` for ${ticketCost} tickets` : ""
        }.`,
      });

      setUrl("");
      setPreview(null);
      fetchRequests();
      fetchUserQuota();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "approved":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400";
      case "approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400";
    }
  };

  const ticketCost = calculateTicketCost();
  const quotaUsed = Math.min(quota.weekly_requests_used, WEEKLY_LIMIT);

  return (
    <div className="space-y-6">
      {/* Request Form */}
      <Card className="bg-gradient-card border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            Request New Novel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weekly Quota */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Weekly Quota</span>
              <span className="text-sm text-muted-foreground">
                {quotaUsed} / {WEEKLY_LIMIT} used
              </span>
            </div>
            <Progress
              value={(quotaUsed / WEEKLY_LIMIT) * 100}
              className="h-2 mb-2"
            />
            <p className="text-xs text-muted-foreground">
              Resets every Sunday. Additional requests cost tickets.
            </p>
          </div>

          {/* Ticket Cost */}
          {ticketCost > 0 && (
            <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
              <p className="text-sm font-medium text-accent mb-1">
                This request will cost {ticketCost} tickets
              </p>
              <p className="text-xs text-muted-foreground">
                You have {quota.tickets} tickets available
              </p>
            </div>
          )}

          {/* URL Input */}
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://example.com/novel/123"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Supported domains:{" "}
              {SUPPORTED_DOMAINS.slice(0, 3).join(", ")} and{" "}
              {SUPPORTED_DOMAINS.length - 3} more
            </p>
          </div>

          {/* Metadata Preview */}
          {preview && (
            <div className="bg-muted/30 p-4 rounded-lg flex gap-4 items-center">
              {preview.cover_url && (
                <img
                  src={preview.cover_url}
                  alt="Cover"
                  className="w-16 h-24 object-cover rounded"
                />
              )}
              <div>
                <p className="font-medium">{preview.title}</p>
                <p className="text-xs text-muted-foreground">
                  Preview before submitting
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={submitRequest}
            disabled={loading || !url.trim()}
            className="w-full bg-gradient-primary"
          >
            {loading
              ? "Submitting..."
              : `Submit Request${
                  ticketCost > 0 ? ` (${ticketCost} tickets)` : ""
                }`}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card className="bg-gradient-card border-0 shadow-card">
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No requests yet. Submit your first novel request above!
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg"
                >
                  <div className="mt-1">{getStatusIcon(request.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      {request.ticket_cost > 0 && (
                        <Badge variant="outline">
                          {request.ticket_cost} tickets
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">
                      {request.title || "Processing..."}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {request.url}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    {request.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
