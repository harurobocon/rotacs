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

function getEnvPath(env: string) {
  if (env === "production") {
    return path.resolve(__dirname, "../.env.production.local");
  }

  return path.resolve(__dirname, "../.env.development.local");
}

function loadEnv(env: string) {
  const baseEnvPath = path.resolve(__dirname, "../.env");
  const scopedEnvPath = getEnvPath(env);

  dotenv.config({ path: baseEnvPath });
  dotenv.config({ path: scopedEnvPath, override: true });
}

function getCollectionNames() {
  const check1Collection = process.env.NEXT_PUBLIC_CHECK1_RESERVATION_COLLECTION;
  const check2Collection = process.env.NEXT_PUBLIC_CHECK2_RESERVATION_COLLECTION;
  const testrunCollection = process.env.NEXT_PUBLIC_TESTRUN_RESERVATION_COLLECTION;

  if (!check1Collection || !check2Collection || !testrunCollection) {
    throw new Error(
      "Missing reservation collection env vars. Set NEXT_PUBLIC_CHECK1_RESERVATION_COLLECTION, NEXT_PUBLIC_CHECK2_RESERVATION_COLLECTION, and NEXT_PUBLIC_TESTRUN_RESERVATION_COLLECTION.",
    );
  }

  return {
    check1Collection,
    check2Collection,
    testrunCollection,
  };
}

async function main() {
  const env = process.env.APP_ENV || "development";
  console.log(`Generating firestore.indexes.json for ${env}...`);

  loadEnv(env);
  const { check1Collection, check2Collection, testrunCollection } =
    getCollectionNames();

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
