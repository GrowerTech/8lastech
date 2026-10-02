import { hash, verify } from "@node-rs/argon2";

// argon2id with OWASP-recommended minimums.
const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (pw: string) => hash(pw, OPTS);

// A fixed hash lets us spend equal time on unknown emails (no user enumeration by timing).
let dummy: Promise<string> | undefined;
export async function verifyPassword(stored: string | null, pw: string): Promise<boolean> {
  if (!stored) {
    dummy ??= hashPassword("dummy-password-for-timing");
    await verify(await dummy, pw).catch(() => false);
    return false;
  }
  return verify(stored, pw).catch(() => false);
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return "Password must be at least 12 characters";
  if (pw.length > 128) return "Password must be at most 128 characters";
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw))
    return "Password must include upper case, lower case and a number";
  return null;
}
