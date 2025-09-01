import { useAuth } from "@/hooks/useAuth";
import { XPProgress } from "@/components/XPProgress";
import { Navigate } from "react-router-dom";

const ProfilePerks = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <XPProgress userId={user.id} />
      </div>
    </div>
  );
};

export default ProfilePerks;