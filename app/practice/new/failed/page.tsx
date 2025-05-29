"use client";

import "client-only";

import React, { useEffect, useState } from "react";

import ResultCard from "@/components/result-card";
import { pageContainer } from "@/components/primitives";

export default function NewPracticeFailed() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const msg = searchParams.get("message");

    setMessage(msg);
  }, []);

  return (
    <div className={pageContainer()}>
      <ResultCard
        message={message ?? "不明なエラーが発生しました"}
        returnHref="/practice"
        returnText="試走場予約に戻る"
        status="danger"
        title="予約に失敗しました"
      />
    </div>
  );
}
