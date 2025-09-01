interface Props {
  result: { success: boolean; error?: string } | null;
}

export default function IngestionStatus({ result }: Props) {
  if (!result) return null;
  return (
    <div className={`text-sm ${result.success ? "text-green-600" : "text-red-600"}`}>
      {result.success ? "Ingestion successful!" : result.error}
    </div>
  );
}
