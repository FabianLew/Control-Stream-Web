import { CreateStreamForm } from "@/components/stream/CreateStreamForm";

export default function CreateStreamPage() {
  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create New Stream</h1>
        <p className="text-text-secondary">
          Map a technical topic or table to a stream definition.
        </p>
      </div>

      <CreateStreamForm />
    </div>
  );
}