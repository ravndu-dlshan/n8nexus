import { createFileRoute } from "@tanstack/react-router";
import { BusinessProfileForm } from "@/components/business-profile/BusinessProfileForm";

export const Route = createFileRoute("/_dash/business-profile")({
  head: () => ({
    meta: [
      { title: "Business Profile — N8Nexus" },
      {
        name: "description",
        content: "Tell N8Nexus about your business for smarter automation suggestions.",
      },
    ],
  }),
  component: BusinessProfilePage,
});

function BusinessProfilePage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <BusinessProfileForm />
    </div>
  );
}
