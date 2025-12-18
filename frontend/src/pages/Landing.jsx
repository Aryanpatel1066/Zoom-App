// src/pages/Landing.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Create new room
  const handleNewMeeting = async () => {
    try {
      setLoading(true);
      const res = await api.post("/rooms", { title: `${user.firstName}'s meeting` });
      const { room } = res.data;
      // redirect to room page using room code and id
      navigate(`/room/${room.code}?id=${room._id}`);
    } catch (err) {
      console.error("Create room failed", err);
      alert(err?.response?.data?.message || "Could not create room");
    } finally {
      setLoading(false);
    }
  };
//join existing room or meeting
  // const handleJoin = () => {
  //   if (!joinCode.trim()) return alert("Enter a room code");
  //   navigate(`/room/${joinCode.trim()}`);
  // };
const handleJoin = async () => {
  if (!joinCode.trim()) {
    alert("Enter a room code");
    return;
  }

  try {
    setLoading(true);

    // ✅ CHECK ROOM EXISTS
    const res = await api.get(`/rooms/code/${joinCode.trim()}`);

    const { room } = res.data;

    // ✅ ONLY THEN NAVIGATE
    navigate(`/room/${room.code}?id=${room._id}`);
  } catch (err) {
    alert(err?.response?.data?.message || "Room not found");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.firstName}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Start a new meeting</h2>
          <p className="text-sm text-gray-600 mb-4">Create a meeting and invite others with the code.</p>
          <button
            onClick={handleNewMeeting}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? "Creating..." : "New meeting"}
          </button>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Join with a code</h2>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter room code"
            className="w-full mb-4 px-3 py-2 border rounded"
          />
          <button
            onClick={handleJoin}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
