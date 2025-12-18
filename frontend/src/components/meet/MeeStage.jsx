export default function MeetStage({ user }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-3">
        <img
          src={user?.avatar || "https://i.pravatar.cc/150"}
          alt="avatar"
          className="w-28 h-28 rounded-full"
        />
        <span className="text-sm text-gray-300">{user?.firstName}</span>
      </div>
    </div>
  );
}
