type AvatarProps = {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
};

function getInitials(username: string) {
  const trimmed = username.trim();
  if (!trimmed) {
    return "?";
  }
  return trimmed.slice(0, 1).toUpperCase();
}

export function Avatar({ username, avatarUrl, size = 36, className = "" }: AvatarProps) {
  const initials = getInitials(username);
  const mergedClassName = `inline-flex items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-semibold text-slate-700 ${className}`;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${username}のアイコン`}
        width={size}
        height={size}
        className={mergedClassName}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }

  return (
    <span className={mergedClassName} style={{ width: size, height: size }}>
      {initials}
    </span>
  );
}
