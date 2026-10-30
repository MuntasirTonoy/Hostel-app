/**
 * Creates a user (or resets their password) and makes sure they own a hostel.
 *
 *   npm run admin:create -- --email you@example.com --password "a-strong-password" [--name "Name"] [--hostel "Hostel name"]
 *
 * Normally users sign up at /register; this is for setup and password resets.
 */
import { disconnectDB } from "../src/lib/mongodb";
import { upsertAdmin } from "../src/services/admin-service";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email");
  const password = arg("password") ?? process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error(
      'Usage: npm run admin:create -- --email you@example.com --password "secret" [--name "Name"] [--hostel "Hostel"]',
    );
    process.exit(1);
  }
  const hostel = await upsertAdmin(email, password, arg("name") ?? "", arg("hostel"));
  console.log(`User ready: ${email.toLowerCase()} — hostel "${hostel.name}" (code: ${hostel.code})`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
