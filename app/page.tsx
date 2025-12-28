import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import GraffitiChat from "@/components/GraffitiChat";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
        <GraffitiChat />
      </div>
    </div>
  );
}
