import { NextResponse } from "next/server";

const REPO_OWNER = "harurobocon";
const REPO_NAME = "rotacs";
const REPO_REF = "dev";
const LOGIC_FILES = {
  check1: "app/check1/new/page.tsx",
  check2: "app/check2/new/page.tsx",
  practice: "app/practice/new/page.tsx",
  testrun: "app/testrun/new/page.tsx",
} as const;

const CONDITION_NEEDLES = {
  preventDuplicateReservation: "setting.conditions.preventDuplicateReservation",
  requireCheck1Pass: "setting.conditions.requireCheck1Pass",
  allowRobotCheckInput: "setting.conditions.allowRobotCheckInput",
  requireRobotCheckOnFirstTestrun:
    "setting.conditions.requireRobotCheckOnFirstTestrun",
} as const;

type ReservationType = keyof typeof LOGIC_FILES;
type ConditionKey = keyof typeof CONDITION_NEEDLES;

interface LogicSnippet {
  key: ConditionKey;
  path: string;
  rawUrl: string;
  blobUrl: string;
  code: string;
  startLine: number;
  endLine: number;
  error?: string;
}

function getLineNumberAt(text: string, index: number): number {
  const sliced = text.slice(0, index);

  return sliced.split("\n").length;
}

function findBraceEnd(text: string, openBraceIndex: number): number {
  let depth = 0;

  for (let i = openBraceIndex; i < text.length; i += 1) {
    const char = text[i];

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function extractBlockByNeedle(
  content: string,
  needle: string,
): { code: string; startLine: number; endLine: number } | null {
  const needleIndex = content.indexOf(needle);

  if (needleIndex < 0) {
    return null;
  }

  let blockStart = content.lastIndexOf("if", needleIndex);

  if (blockStart < 0) {
    blockStart = needleIndex;
  }

  const lineStart = content.lastIndexOf("\n", blockStart);
  const braceStart = content.indexOf("{", needleIndex);

  if (braceStart < 0) {
    return null;
  }

  const braceEnd = findBraceEnd(content, braceStart);

  if (braceEnd < 0) {
    return null;
  }

  const sliceStart = lineStart >= 0 ? lineStart + 1 : blockStart;
  const sliceEnd = braceEnd + 1;
  const code = content.slice(sliceStart, sliceEnd);

  return {
    code,
    startLine: getLineNumberAt(content, sliceStart),
    endLine: getLineNumberAt(content, sliceEnd),
  };
}

function buildSnippet(
  content: string,
  path: string,
  repoRef: string,
  key: ConditionKey,
): LogicSnippet {
  const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${repoRef}/${path}`;
  const baseBlobUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${repoRef}/${path}`;
  const needle = CONDITION_NEEDLES[key];
  const extracted = extractBlockByNeedle(content, needle);

  if (!extracted) {
    return {
      key,
      path,
      rawUrl,
      blobUrl: baseBlobUrl,
      code: "",
      startLine: 0,
      endLine: 0,
      error: "対象コードを抽出できませんでした",
    };
  }

  return {
    key,
    path,
    rawUrl,
    blobUrl: `${baseBlobUrl}#L${extracted.startLine}-L${extracted.endLine}`,
    code: extracted.code,
    startLine: extracted.startLine,
    endLine: extracted.endLine,
  };
}

function buildErrorSnippet(
  path: string,
  repoRef: string,
  key: ConditionKey,
  error: string,
): LogicSnippet {
  const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${repoRef}/${path}`;

  return {
    key,
    path,
    rawUrl,
    blobUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${repoRef}/${path}`,
    code: "",
    startLine: 0,
    endLine: 0,
    error,
  };
}

export async function GET() {
  try {
    const repoRef = REPO_REF;

    const entries = await Promise.all(
      Object.entries(LOGIC_FILES).map(async ([type, filePath]) => {
        const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${repoRef}/${filePath}`;
        let snippets: LogicSnippet[] = [];

        try {
          const response = await fetch(rawUrl, {
            next: { revalidate: 300 },
          });

          if (!response.ok) {
            snippets = (Object.keys(CONDITION_NEEDLES) as ConditionKey[]).map(
              (key) =>
                buildErrorSnippet(
                  filePath,
                  repoRef,
                  key,
                  `取得失敗: ${response.status}`,
                ),
            );
          } else {
            const content = await response.text();

            snippets = (Object.keys(CONDITION_NEEDLES) as ConditionKey[]).map(
              (key) => buildSnippet(content, filePath, repoRef, key),
            );
          }
        } catch {
          snippets = (Object.keys(CONDITION_NEEDLES) as ConditionKey[]).map(
            (key) =>
              buildErrorSnippet(
                filePath,
                repoRef,
                key,
                "取得中にエラーが発生しました",
              ),
          );
        }

        return [type, snippets] as const;
      }),
    );

    const snippetsByType = entries.reduce(
      (acc, [type, snippets]) => {
        acc[type as ReservationType] = snippets.reduce(
          (snippetAcc, snippet) => {
            snippetAcc[snippet.key as ConditionKey] = snippet;

            return snippetAcc;
          },
          {} as Record<ConditionKey, LogicSnippet>,
        );

        return acc;
      },
      {} as Record<ReservationType, Record<ConditionKey, LogicSnippet>>,
    );

    return NextResponse.json({ commitSha: repoRef, snippetsByType });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "ロジック表示情報の取得に失敗しました",
      },
      { status: 500 },
    );
  }
}
