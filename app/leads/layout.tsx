import TopBar from "@/components/TopBar";

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBar />
      <div className="container">{children}</div>
    </>
  );
}
