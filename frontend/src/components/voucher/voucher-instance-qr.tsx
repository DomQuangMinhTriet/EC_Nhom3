"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toDataURL } from "qrcode";

type VoucherInstanceQrProps = {
  value: string;
  size?: number;
};

export function VoucherInstanceQr({ value, size = 240 }: VoucherInstanceQrProps) {
  const [qrDataUri, setQrDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setQrDataUri(null);
    setError(null);

    toDataURL(value, { errorCorrectionLevel: "M", margin: 2, width: size })
      .then((dataUri) => {
        if (active) setQrDataUri(dataUri);
      })
      .catch(() => {
        if (active) setError("Không thể tạo QR cho voucher này.");
      });

    return () => {
      active = false;
    };
  }, [size, value]);

  if (error) {
    return (
      <div className="grid aspect-square w-full max-w-[240px] place-items-center rounded-lg border border-red-100 bg-red-50 p-4 text-center text-xs font-semibold text-danger">
        {error}
      </div>
    );
  }

  if (!qrDataUri) {
    return <div className="aspect-square w-full max-w-[240px] animate-pulse rounded-lg bg-slate-100" />;
  }

  return (
    <Image
      src={qrDataUri}
      alt={`QR voucher ${value}`}
      width={size}
      height={size}
      unoptimized
      className="h-auto w-full max-w-[240px] rounded-lg border border-slate-200 bg-white p-3"
    />
  );
}
