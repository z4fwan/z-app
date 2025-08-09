import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios"; // <-- import your axios instance

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suspendModal, setSuspendModal] = useState({ show: false, userId: null });
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("1d");

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/admin/users");
      const userList = Array.isArray(res.data.users)
        ? res.data.users
        : Array.isArray(res.data)
        ? res.data
        : [];
      setUsers(userList);
    } catch (err) {
      console.error("Error fetching users", err);
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (userId, action) => {
    try {
      if (action === "suspend") {
        setSuspendModal({ show: true, userId });
        return;
      }
      const url = `/admin/${action}/${userId}`;
      const res = await axiosInstance.put(url);
      toast.success(res.data.message || `${action} success`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  const confirmSuspend = async () => {
    try {
      const res = await axiosInstance.put(
        `/admin/suspend/${suspendModal.userId}`,
        { reason: suspendReason, until: getFutureDate(suspendDuration) }
      );
      toast.success(res.data.message || "User suspended");
      setSuspendModal({ show: false, userId: null });
      setSuspendReason("");
      setSuspendDuration("1d");
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Suspend failed");
    }
  };

  const getFutureDate = (durationStr) => {
    const now = new Date();
    const num = parseInt(durationStr);
    const unit = durationStr.replace(num, "");

    if (unit === "d" || unit === "") now.setDate(now.getDate() + num);
    else if (unit === "w") now.setDate(now.getDate() + num * 7);
    else if (unit === "m") now.setDate(now.getDate() + num * 30);

    return now.toISOString();
  };

  const handleDelete = async (userId) => {
    try {
      const res = await axiosInstance.delete(`/admin/delete/${userId}`);
      toast.success(res.data.message || "User deleted");
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="h-screen pt-20 px-4 bg-base-200 overflow-auto">
      <div className="max-w-7xl mx-auto bg-base-100 shadow-lg rounded-xl p-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Admin Dashboard</h1>

        {loading ? (
          <div className="text-center text-lg">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-red-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full table-zebra">
              <thead>
                <tr className="text-base font-semibold text-center">
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Suspended</th>
                  <th>Blocked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user._id} className="text-center">
                    <td>{idx + 1}</td>
                    <td className="flex items-center gap-2 justify-center">
                      {user.fullName}
                      {user.isVerified && <span className="text-blue-500 text-lg">✔️</span>}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.isOnline ? "🟢 Online" : "⚪ Offline"}</td>
                    <td>{user.isVerified ? "✅" : "❌"}</td>
                    <td>{user.isSuspended ? "⏸️ Suspended" : "—"}</td>
                    <td>{user.isBlocked ? "🚫 Blocked" : "—"}</td>
                    <td>
                      <div className="flex flex-wrap justify-center gap-2 max-w-[300px]">
                        <button
                          onClick={() =>
                            handleAction(user._id, user.isSuspended ? "unsuspend" : "suspend")
                          }
                          className="btn btn-xs sm:btn-sm btn-warning"
                        >
                          {user.isSuspended ? "Unsuspend" : "Suspend"}
                        </button>
                        <button
                          onClick={() =>
                            handleAction(user._id, user.isBlocked ? "unblock" : "block")
                          }
                          className={`btn btn-xs sm:btn-sm ${
                            user.isBlocked ? "btn-outline btn-neutral" : "btn-error"
                          }`}
                        >
                          {user.isBlocked ? "Unblock" : "Block"}
                        </button>
                        <button
                          onClick={() =>
                            handleAction(user._id, user.isVerified ? "unverify" : "verify")
                          }
                          className={`btn btn-xs sm:btn-sm ${
                            user.isVerified ? "btn-outline btn-info" : "btn-success"
                          }`}
                        >
                          {user.isVerified ? "Unverify" : "Verify"}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="btn btn-xs sm:btn-sm btn-outline btn-error"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspend Modal */}
      {suspendModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-md space-y-4">
            <h2 className="text-xl font-bold">Suspend User</h2>
            <label className="form-control">
              <span className="label-text">Reason</span>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="input input-bordered"
                placeholder="Enter suspension reason"
              />
            </label>
            <label className="form-control">
              <span className="label-text">Duration</span>
              <select
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(e.target.value)}
                className="select select-bordered"
              >
                <option value="1d">1 day</option>
                <option value="3d">3 days</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-outline"
                onClick={() => setSuspendModal({ show: false, userId: null })}
              >
                Cancel
              </button>
              <button className="btn btn-warning" onClick={confirmSuspend}>
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
