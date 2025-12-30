import { Link } from "react-router-dom";
import { Video, Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* TOP SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* BRAND */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Video className="text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Zoom<span className="text-blue-600">App</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Simple, secure, and fast video conferencing for teams, friends,
              and remote collaboration.
            </p>
          </div>

          {/* PRODUCT */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <Link to="/landing" className="hover:text-blue-600">
                  Landing
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-blue-600">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-600">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* FEATURES */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Features
            </h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>HD Video Calls</li>
              <li>Screen Sharing</li>
              <li>Secure Meetings</li>
              <li>Live Chat</li>
            </ul>
          </div>

          {/* SOCIAL */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Connect
            </h4>
            <div className="flex gap-4">
              <a
                href="https://github.com/Aryanpatel1066"
                className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 transition"
              >
                <Github size={18} />
              </a>
              <a
                href="https://www.linkedin.com/in/aryanpatel1066/"
                className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 transition"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="mailto:aryanpatel1248@gmail.com"
                className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 transition"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-gray-200 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} ZoomApp. All rights reserved.
          </p>

          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="#" className="hover:text-blue-600">
              Privacy Policy
            </Link>
            <Link to="#" className="hover:text-blue-600">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
