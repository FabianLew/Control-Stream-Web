import { CreateConnectionForm } from "@/components/connection/CreateConnectionForm";

export default function CreateConnectionPage() {
  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create New Connection</h1>
        <p className="text-text-secondary">
          Define connection details for Kafka, RabbitMQ, or PostgreSQL.
        </p>
      </div>
      
      <CreateConnectionForm />
    </div>
  );
}