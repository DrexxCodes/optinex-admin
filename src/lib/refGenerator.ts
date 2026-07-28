// Reference Generator — shared across check-in rewards, funding, top-ups, and payout references.
// Format: YYYYMMDDHHMMSS + 10 random numeric digits.
export function generateReference(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');

  const stamp =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());

  let randomDigits = '';
  for (let i = 0; i < 10; i++) {
    randomDigits += Math.floor(Math.random() * 10).toString();
  }

  return `${stamp}${randomDigits}`;
}
