import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  // const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-xl mb-2">Welcome, {user?.name}!</h1>
      <p className="mb-4">
        Role: <strong>{user?.role}</strong>
      </p>

      {/* Conditional UI */}
      {user?.role?.includes("Admin") && (
        <div className="bg-green-100 p-3 rounded mb-3">
          <button className="mt-2 bg-green-600 text-white px-3 py-1 rounded">
            <Link to="enroll">Create New User</Link>
          </button>
        </div>
      )}
    </div>
  );
}
