import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";

type IndexField = {
  fieldPath: string;
  order?: "ASCENDING" | "DESCENDING";
  arrayConfig?: "CONTAINS";
};

type Index = {
  collectionGroup: string;
  queryScope: "COLLECTION";
  fields: IndexField[];
};

async function main() {
  const env = process.env.APP_ENV || "development";
  console.log(`Generating firestore.indexes.json for ${env}...`);

  const envPath =
    env === "production"
      ? path.resolve(__dirname, "../.env.production.local")
      : path.resolve(__dirname, "../.env.development.local");

  dotenv.config({ path: envPath });

  const check1Collection =
    process.env.NEXT_PUBLIC_CHECK1_RESERVATION_COLLECTION ||
    "check1_reservations_dev";
  const check2Collection =
    process.env.NEXT_PUBLIC_CHECK2_RESERVATION_COLLECTION ||
    "check2_reservations_dev";
  const testrunCollection =
    process.env.NEXT_PUBLIC_TESTRUN_RESERVATION_COLLECTION ||
    "testrun_reservations_dev";

  const indexes: Index[] = [
    {
      collectionGroup: check1Collection,
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "user_display_name", order: "ASCENDING" },
        { fieldPath: "reserved_at", order: "DESCENDING" },
      ],
    },
    {
      collectionGroup: check2Collection,
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "user_display_name", order: "ASCENDING" },
        { fieldPath: "reserved_at", order: "DESCENDING" },
      ],
    },
    {
      collectionGroup: testrunCollection,
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "user_display_name", order: "ASCENDING" },
        { fieldPath: "reservation_count", order: "ASCENDING" },
        { fieldPath: "reserved_at", order: "DESCENDING" },
      ],
    },
  ];

  const firestoreConfig = {
    indexes: indexes,
    fieldOverrides: [],
  };

  const outputPath = path.resolve(__dirname, "../firestore.indexes.json");
  await fs.writeFile(outputPath, JSON.stringify(firestoreConfig, null, 2));

  console.log(`Successfully generated ${outputPath}`);
}

main();
