"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MPINTestPage from './mpin-test';

export default function TestPage() {
  return <MPINTestPage />;
}