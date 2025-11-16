import { hash } from "@node-rs/argon2";
import { Kysely } from "kysely";
import { generateIdFromEntropySize } from "lucia";

export async function up(kysely: Kysely<any>): Promise<void> {
  await kysely.schema
    .createTable("user")
    .addColumn("id", "varchar", (column) => column.primaryKey())
    .addColumn("username", "varchar", (column) => column.notNull().unique())
    .addColumn("password_hash", "varchar", (column) => column.notNull())
    .addColumn("display_name", "varchar", (column) => column.notNull())
    .addColumn("role", "varchar", (column) => column.notNull())
    .addColumn("pit_side", "varchar", (column) => column.notNull())
    .addColumn("pit_number", "integer", (column) => column.notNull())
    .execute();

  const adminEntry = await createUserInfo(
    "admin",
    process.env.ROTACS_ADMIN_PASSWORD!,
    "Admin",
    "admin",
    "東",
    0,
  );

  if ("errors" in adminEntry) {
    throw new Error(adminEntry.errors);
  }

  await kysely.insertInto("user").values(adminEntry).execute();

  await kysely.schema
    .createTable("session")
    .addColumn("id", "varchar", (column) => column.primaryKey())
    .addColumn("user_id", "varchar", (column) =>
      column.notNull().references("user.id"),
    )
    .addColumn("expires_at", "timestamp", (column) => column.notNull())
    .execute();
}

export async function down(kysely: Kysely<any>): Promise<void> {
  await kysely.schema.dropTable("session").execute();
  await kysely.schema.dropTable("user").execute();
}

// This is a helper function to create a user entry
// See "frozen in time" policy of Kysely: https://www.kysely.dev/docs/migrations
interface UserTable {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: UserRole;
  pit_side: CheckSide;
  pit_number: number;
}

type UserRole = "admin" | "user";
type CheckSide = "東" | "西";

interface ActionResult {
  errors: string;
}

async function createUserInfo(
  username: string,
  password: string,
  display_name = "",
  role: UserRole = "user",
  pit_side: CheckSide,
  pit_number: number,
): Promise<UserTable | ActionResult> {
  // username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
  // keep in mind some database (e.g. mysql) are case insensitive
  if (
    typeof username !== "string" ||
    username.length < 3 ||
    username.length > 31 ||
    !/^[a-z0-9_-]+$/.test(username)
  ) {
    return {
      errors: "Invalid username",
    };
  }

  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 255
  ) {
    return {
      errors: "Invalid password",
    };
  }

  const passwordHash = await hash(password, {
    // recommended minimum parameters
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
  const userId = generateIdFromEntropySize(10); // 16 characters long

  return {
    id: userId,
    username: username,
    password_hash: passwordHash,
    display_name: display_name,
    role: role,
    pit_side: pit_side,
    pit_number: pit_number,
  };
}
