"use client";

import dynamic from "next/dynamic";

const InvitationEditor = dynamic(
  () => import("@/components/user-editor/InvitationEditor").then((mod) => mod.InvitationEditor),
  { ssr: false }
);

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <InvitationEditor />
    </div>
  );
}
