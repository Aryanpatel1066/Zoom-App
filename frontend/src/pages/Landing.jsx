import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  Video,
  Keyboard,
  ShieldCheck,
  MessageCircle,
  Monitor,
} from "lucide-react";
import { landingSlides } from "../utils/landingSlides";
import Footer from "../components/Footer";
export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % landingSlides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleNewMeeting = async () => {
    try {
      setLoading(true);
      const res = await api.post("/rooms", {
        title: `${user.firstName}'s meeting`,
      });
      const { room } = res.data;
      navigate(`/room/${room.code}?id=${room._id}`);
    } catch (err) {
      alert(err?.response?.data?.message || "Could not create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return alert("Enter a meeting code");

    try {
      setLoading(true);
      const res = await api.get(`/rooms/code/${joinCode.trim()}`);
      const { room } = res.data;
      navigate(`/room/${room.code}?id=${room._id}`);
    } catch (err) {
      alert(err?.response?.data?.message || "Room not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>    <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] to-[#eef2ff] flex items-center px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* LEFT CONTENT */}
        <div>
          <span className="inline-block mb-4 text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            Video Conferencing App
          </span>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Connect. <span className="text-blue-600">Communicate.</span>
            <br />
            Collaborate from anywhere.
          </h1>

          <p className="text-gray-600 text-lg mb-10 max-w-lg">
            High-quality video meetings, screen sharing, and secure
            collaboration — all in one place.
          </p>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            {/* NEW MEETING */}
            <button
              onClick={handleNewMeeting}
              disabled={loading}
              className="
                flex items-center justify-center gap-2
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-700 hover:to-indigo-700
                text-white px-7 py-3 rounded-full
                font-medium shadow-lg transition
              "
            >
              <Video size={18} />
              {loading ? "Creating..." : "New Meeting"}
            </button>

            {/* JOIN MEETING */}
            <div className="flex items-center bg-white border rounded-full px-4 py-2 shadow-sm w-full sm:max-w-md">
              <Keyboard size={18} className="text-gray-400 mr-2" />
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter meeting code"
                className="outline-none flex-1 text-sm"
              />
              <button
                onClick={handleJoin}
                className="text-blue-600 font-semibold px-3 hover:underline"
              >
                Join
              </button>
            </div>
          </div>

          {/* FEATURES */}
          <div className="grid grid-cols-2 gap-6 max-w-md">
            <Feature icon={Monitor} label="HD Video" />
            <Feature icon={MessageCircle} label="Chat & Messaging" />
            <Feature icon={ShieldCheck} label="Secure Meetings" />
            <Feature icon={Video} label="Screen Sharing" />
          </div>
        </div>


        {/* RIGHT SIDE SLIDER */}
        <div className="hidden md:flex justify-center">

          <div
            className="relative w-[380px] h-[380px] rounded-3xl 
  bg-gradient-to-br from-blue-500/30 via-indigo-500/30 to-purple-500/30
  shadow-[0_30px_80px_rgba(79,70,229,0.35)]
  flex items-center justify-center"
          >
            <div
              className="absolute inset-5 bg-white rounded-2xl 
      flex flex-col items-center justify-center text-center p-8
      transition-all duration-500"
            >
              {landingSlides.map((slide, index) => {
                const Icon = slide.icon;
                return (
                  <div
                    key={index}
                    className={`absolute transition-opacity duration-700 ${index === activeSlide ? "opacity-100" : "opacity-0"
                      }`}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 flex items-center justify-center">
                      <Icon size={28} className="text-blue-600" />
                    </div>

                    <h3 className="text-2xl font-bold mb-3 text-gray-900">
                      {slide.title}
                    </h3>

                    <p className="text-gray-500 text-base leading-relaxed max-w-xs">
                      {slide.description}
                    </p>
                  </div>
                );
              })}
              {/* DOTS (INSIDE WHITE CARD) */}
              <div className="absolute bottom-4 flex gap-2">
                {landingSlides.map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${i === activeSlide ? "bg-blue-600 w-5" : "bg-gray-300 w-2"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer/>
    </>
      );
}

      /* Feature Item */
      function Feature({icon: Icon, label }) {
  return (
      <>
        {" "}
        <div className="flex items-center gap-3 text-gray-700">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Icon size={18} className="text-blue-600" />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </div>
      </>
      );
}
