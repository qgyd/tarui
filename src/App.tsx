import { Navigate, Outlet } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

function App() {
  const { isLoggedIn } = useSelector((state: RootState) => state.user);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default App;
