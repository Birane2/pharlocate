function ProfileAvatar({ firstName = "", lastName = "", email = "" }) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.trim()
    || email?.slice(0, 2)
    || "AD";

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2F6E9E] to-[#2FA6A3] text-xl font-black uppercase text-white shadow-sm">
      {initials}
    </div>
  );
}

export default ProfileAvatar;
