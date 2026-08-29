/** Home route for the currently logged-in user (role-based). */
export function getUserHomePath(user) {
  if (!user?.role) return '/';
  if (user.role === 'vendor') return '/vendor';
  return '/dashboard';
}
