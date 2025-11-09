import { Kysely } from "kysely";

export async function up(kysely: Kysely<any>): Promise<void> {
  await kysely.schema
    .alterTable("user")
    .addColumn("slack_channel_id", "varchar")
    .execute();
}

export async function down(kysely: Kysely<any>): Promise<void> {
  await kysely.schema
    .alterTable("user")
    .dropColumn("slack_channel_id")
    .execute();
}
