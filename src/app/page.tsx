import { Header } from "@/components/header";
import { DashboardView } from "@/components/dashboard-view";

export default function HomePage() {
  return (
    <>
      <Header title="Budget Tracker" />
      <DashboardView />
    </>
  );
}
