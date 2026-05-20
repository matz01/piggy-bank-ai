interface Props {
  titolo: string;
  importo: number;
}

export function TransactionPreview({ titolo, importo }: Props) {
  return (
    <div className="text-center">
      <p className="text-2xl font-semibold text-gray-800">{titolo}</p>
      <p className="text-4xl font-bold text-blue-600 mt-1">€ {importo.toFixed(2)}</p>
    </div>
  );
}
