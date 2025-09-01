import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LogEntry {
  id: string;
  url: string;
  created_at: string;
  status?: string;
  title?: string;
}

export default function LogsBox() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">📜 Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">📜 Recent Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground">No requests found</p>
        ) : (
          <ul className="text-sm space-y-2">
            {logs.map((log, i) => (
              <li key={log.id || i} className="flex flex-col gap-1 p-2 border rounded-md">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs truncate flex-1">{log.url}</span>
                  {log.status && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      log.status === 'completed' ? 'bg-green-100 text-green-800' :
                      log.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  )}
                </div>
                {log.title && <span className="text-sm font-medium">{log.title}</span>}
                <span className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
