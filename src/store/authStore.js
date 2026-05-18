export function getAvatarLetter(user) {
  return (user?.user_metadata?.full_name || user?.email || "U")[0].toUpperCase();
}

export function getPreparedBy(user) {
  return user?.user_metadata?.full_name || user?.email || "Unknown";
}
