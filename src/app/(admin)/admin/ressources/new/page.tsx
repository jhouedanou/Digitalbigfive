import ResourceForm from "@/components/admin/ResourceForm";

export default function NewResourcePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Nouvelle ressource
      </h1>
      <ResourceForm />
    </div>
  );
}
