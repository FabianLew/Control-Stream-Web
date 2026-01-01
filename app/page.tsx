import Link from "next/link";
import {
  Activity,
  Search,
  Link2,
  GitBranch,
  ArrowRight,
  Zap,
  Clock,
  Shield,
  Eye,
  Database,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d0d12] text-gray-100">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Logo and Badge */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">CS</span>
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">
            ControlStream
          </span>
          <span className="ml-2 px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-800 rounded-full uppercase tracking-wider">
            Public Preview
          </span>
        </div>

        {/* Main Heading */}
        <div className="text-center max-w-3xl mb-8">
          <p className="text-gray-500 uppercase tracking-widest text-sm mb-4">
            Event Debugging Workspace
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Debug real events.
            <br />
            <span className="text-purple-500">Not telemetry.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            A single UI to search, inspect and replay business events across
            heterogeneous systems — built for fast incident response and
            confident fixes.
          </p>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { icon: Link2, label: "Correlation-first" },
            { icon: Activity, label: "Live + replay workflows" },
            { icon: Eye, label: "Readable payloads" },
            { icon: Shield, label: "Audit-friendly" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700 text-sm text-gray-200"
            >
              <Icon className="w-4 h-4 text-purple-500" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl w-full mb-12">
          <QuickAccessCard
            href="/live"
            icon={Activity}
            title="Live"
            description="Real-time event streaming"
            color="text-green-500"
          />
          <QuickAccessCard
            href="/search"
            icon={Search}
            title="Search"
            description="Find events by correlation ID"
            color="text-blue-500"
          />
          <QuickAccessCard
            href="/connections"
            icon={Link2}
            title="Connections"
            description="Manage data sources"
            color="text-orange-500"
          />
          <QuickAccessCard
            href="/streams"
            icon={GitBranch}
            title="Streams"
            description="Configure event streams"
            color="text-purple-500"
          />
          <QuickAccessCard
            href="/schema-bundles"
            icon={Database}
            title="Schema Bundles"
            description="Manage data schemas"
            color="text-pink-500"
          />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          <FeatureCard
            icon={Zap}
            title="Unified Search"
            description="Correlation-first filtering across streams and time windows."
          />
          <FeatureCard
            icon={Clock}
            title="Live View"
            description="Watch events as they happen with real-time streaming."
          />
          <FeatureCard
            icon={ArrowRight}
            title="Replay"
            description="Re-emit events to downstream systems for testing and recovery."
          />
        </div>

        {/* Version indicator */}
        <div className="mt-16 text-gray-600 text-sm">v1.0.0 Alpha</div>
      </div>
    </div>
  );
}

interface QuickAccessCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

function QuickAccessCard({
  href,
  icon: Icon,
  title,
  description,
  color,
}: QuickAccessCardProps) {
  return (
    <Link
      href={href}
      className="group p-4 bg-[#14141c] rounded-xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:bg-gray-800/30"
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 bg-[#14141c]/50 rounded-xl border border-gray-800 backdrop-blur-sm">
      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-purple-500" />
      </div>
      <h3 className="font-semibold text-lg mb-2 text-white">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
