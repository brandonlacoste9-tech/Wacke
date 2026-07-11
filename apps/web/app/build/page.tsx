import AIBuildInstall from "@/components/AIBuildInstall";

export const metadata = {
  title: "AI Build — CLI | Wacké",
  description: "Install the AI CLI from your terminal. Powered by Wacké AI.",
};

export default function BuildPage() {
  return (
    <main className="min-h-screen bg-wacke-dark px-6 py-12 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black gradient-text-cyber font-display mb-2">AI Build</h1>
        <p className="text-gray-400 text-sm">The command-line side of the Wacké AI chaos.</p>
      </div>
      <AIBuildInstall />
    </main>
  );
}