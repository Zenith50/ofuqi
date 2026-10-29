import MarketingHeader from "@/components/shell/MarketingHeader";
import RouteEnter from "@/components/shell/RouteEnter";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RouteEnter mode="landing">
      <MarketingHeader />
      {children}
    </RouteEnter>
  );
}
