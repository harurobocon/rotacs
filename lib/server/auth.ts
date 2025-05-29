"use server";

import "server-cli-only";

import { generateIdFromEntropySize, type Session, type User } from "lucia";
import { cookies } from "next/headers";
import { setCookie } from "cookies-next/server";
import { cache } from "react";
import { redirect } from "next/navigation";
import { hash, verify } from "@node-rs/argon2";

import { db } from "@/lib/server/db";
import { lucia } from "@/lib/server/lucia";
import { ActionResult } from "@/types/actions";
import { UserTable } from "@/types/auth";
import { DatabaseUserAttributes, UserRole } from "@/types/auth";
import { CheckSide } from "@/types/check";
import {
  upsertUserToFirestore,
  getUserFromFirestore,
} from "@/lib/server/firestoreUser";

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

export async function createUserInfo(
  username: string,
  password: string,
  display_name: string,
  role: UserRole,
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

// export async function signup(formData: FormData): Promise<ActionResult> {
//   let _userEntry: UserTable | ActionResult;

//   try {
//     const username = formData.get("username")?.toString()!;
//     const password = formData.get("password")?.toString()!;
//     const display_name = formData.get("display_name")?.toString() ?? "";
//     const role = (formData.get("role")?.toString() as UserRole) ?? "user";

//     _userEntry = await createUserInfo(username, password, display_name, role);
//   } catch (error) {
//     return {
//       errors: `Create user failed. Invalid form data. (${error})`,
//     };
//   }

//   if ("errors" in _userEntry) {
//     return _userEntry as ActionResult;
//   }

//   const userEntry = _userEntry as UserTable;

//   // TODO: check if username is already used
//   const validUserId = await db
//     .insertInto("user")
//     .values(userEntry)
//     .returning("id")
//     .executeTakeFirstOrThrow()
//     .then((value) => value.id);

//   if (!validUserId) {
//     return {
//       errors: "Create user failed. No user id returned.",
//     };
//   }

//   const session = await lucia.createSession(validUserId, {});
//   const sessionCookie = lucia.createSessionCookie(session.id);

//   cookies().set(
//     sessionCookie.name,
//     sessionCookie.value,
//     sessionCookie.attributes,
//   );
//   await setCookie(
//     process.env.NEXT_PUBLIC_SESSION_COOKIE_ROLE_NAME!,
//     userEntry.role,
//     { cookies },
//   );

//   // cookies().set(
//   //   process.env.NEXT_PUBLIC_SESSION_COOKIE_ROLE_NAME!,
//   //   userEntry.role,
//   //   sessionCookie.attributes,
//   // );

//   return redirect("/");
// }

export async function login(
  state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const username = formData.get("username");

  if (
    typeof username !== "string" ||
    username.length < 3 ||
    username.length > 31 ||
    !/^[a-z0-9_-]+$/.test(username)
  ) {
    return {
      errors: "ユーザー名の形式が不正です．",
    };
  }
  const password = formData.get("password");

  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 255
  ) {
    return {
      errors: "パスワードの形式が不正です．",
    };
  }

  const existingUser = await db
    .selectFrom("user")
    .selectAll()
    .where("username", "=", username.toLowerCase())
    .executeTakeFirst();

  if (!existingUser) {
    // NOTE:
    // Returning immediately allows malicious actors to figure out valid usernames from response times,
    // allowing them to only focus on guessing passwords in brute-force attacks.
    // As a preventive measure, you may want to hash passwords even for invalid usernames.
    // However, valid usernames can be already be revealed with the signup page among other methods.
    // It will also be much more resource intensive.
    // Since protecting against this is non-trivial,
    // it is crucial your implementation is protected against brute-force attacks with login throttling etc.
    // If usernames are public, you may outright tell the user that the username is invalid.
    return {
      errors: "入力されたユーザー名が存在しません．",
    };
  }

  const validPassword = await verify(existingUser.password_hash, password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  if (!validPassword) {
    return {
      errors: "ユーザー名またはパスワードが間違っています．",
    };
  }

  // Firestoreに存在しなければ作成
  const firestoreUser = await getUserFromFirestore(existingUser.id);

  if (!firestoreUser) {
    await upsertUserToFirestore(existingUser);
  }

  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  await setCookie(
    process.env.NEXT_PUBLIC_SESSION_COOKIE_ROLE_NAME!,
    existingUser.role,
    { cookies },
  );
  const redirectPath = formData.get("redirect");

  return redirect(redirectPath ? redirectPath.toString() : "/");
}

export async function logout(): Promise<ActionResult> {
  const { session } = await validateRequest();

  if (!session) {
    // already logged out
    await setCookie(process.env.NEXT_PUBLIC_SESSION_COOKIE_ROLE_NAME!, "", {
      cookies,
    });

    return {
      errors: "Unauthorized",
    };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();

  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  await setCookie(process.env.NEXT_PUBLIC_SESSION_COOKIE_ROLE_NAME!, "", {
    cookies,
  });

  return redirect("/login");
}

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    const result = await lucia.validateSession(sessionId);

    // next.js throws when you attempt to set cookie when rendering page
    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);

        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
        await setCookie(
          process.env.NEXT_PUBLIC_SESSION_COOKIE_ROLE_NAME!,
          result.user.role,
          { cookies },
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();

        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
        await setCookie(process.env.NEXT_PUBLIC_SESSION_COOKIE_ROLE_NAME!, "", {
          cookies,
        });
      }
    } catch {}

    return result;
  },
);

export async function getAllUsersJson() {
  const users = await db.selectFrom("user").selectAll().execute();

  return JSON.stringify(users);
}
