import Sidebar from "./Sidebar";
import Header from "./Header";
import VapiWidget from "./VapiWidget";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-56">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <VapiWidget />
    </div>
  );
}
