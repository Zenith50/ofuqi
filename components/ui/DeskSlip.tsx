export default function DeskSlip({ label, detail }: { label: string; detail: string }) {
  return (
    <p className="desk-slip">
      <span>{label}</span>
      <strong>{detail}</strong>
    </p>
  );
}
