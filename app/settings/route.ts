import { redirect } from "next/navigation";

export async function GET(_request: Request): Promise<Response> {
  redirect("/settings/notification");
}
