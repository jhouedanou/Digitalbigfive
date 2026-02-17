"use client";

import FlipPDFReader from "@/components/dashboard/FlipPDFReader";

interface PremiumReaderWrapperProps {
  resourceId: string;
  title: string;
  userEmail: string;
  userName: string;
  enableWatermark?: boolean;
}

export default function PremiumReaderWrapper({
  resourceId,
  title,
  userEmail,
  userName,
  enableWatermark = true,
}: PremiumReaderWrapperProps) {
  return (
    <FlipPDFReader
      resourceId={resourceId}
      title={title}
      userEmail={userEmail}
      userName={userName}
    />
  );
}
