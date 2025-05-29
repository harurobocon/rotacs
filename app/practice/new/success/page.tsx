"use client";

import "client-only";

import React from "react";

import ResultCard from "@/components/result-card";
import { pageContainer } from "@/components/primitives";

export default function NewPracticeSuccess() {
  return (
    <div className={pageContainer()}>
      <ResultCard
        returnHref="/practice"
        returnText="試走場予約に戻る"
        status="success"
        title="予約が完了しました"
      />
    </div>
  );
}
