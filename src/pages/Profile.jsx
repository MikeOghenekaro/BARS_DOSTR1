import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>
      <div className="bg-white shadow rounded p-4">
        <div className="mb-3">
          <label className="block text-gray-700">Name:</label>
          <div className="text-lg font-medium">{user?.name || "-"}</div>
        </div>
        <div className="mb-3">
          <label className="block text-gray-700">Email:</label>
          <div className="text-lg font-medium">{user?.email || "-"}</div>
        </div>
        <div className="mb-3">
          <label className="block text-gray-700">Role:</label>
          <div className="text-lg font-medium">
            {Array.isArray(user?.role)
              ? user.role.join(", ")
              : user?.role || "-"}
          </div>
        </div>
        {/* Add more user settings here as needed */}
      </div>
    </div>
  );
}
