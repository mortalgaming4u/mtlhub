import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect to home page since we're using /home as the main route
  return <Navigate to="/" replace />;
};

export default Index;
