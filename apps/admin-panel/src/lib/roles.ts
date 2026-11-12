const RANK: Record<string, number> = {
  SUPER_ADMIN: 100,
  OWNER: 90,
  MANAGER: 70,
  FRONT_DESK: 50,
  HOUSEKEEPING: 30,
  KITCHEN: 30,
  MAINTENANCE: 30,
  GUEST: 10,
};

export function roleAtLeast(role: string | undefined, required: string): boolean {
  return (RANK[role ?? ''] ?? 0) >= (RANK[required] ?? 100);
}
