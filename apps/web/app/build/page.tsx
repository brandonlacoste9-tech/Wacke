import GrokBuildInstall from "@/components/GrokBuildInstall";

export const metadata = {
  title: "Grok Build — CLI | Wacké",
  description: "Install the Grok CLI from your terminal. Powered by Grok 4.5.",
};

export default function BuildPage() {
  return (
    <main className="min-h-screen bg-wacke-dark px-6 py-12 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black gradient-text-cyber font-display mb-2">Grok Build</h1>
        <p className="text-gray-400 text-sm">The command-line side of the Wacké × Grok xAI chaos.</p>
      </div>
      <GrokBuildInstall />
    </main>
  );
}