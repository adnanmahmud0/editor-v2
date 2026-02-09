import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

export default function AddDesignPage() {
  const templates = [
    { id: 1, src: "https://placehold.co/300x400/png?text=Template+1", alt: "Template 1" },
    { id: 2, src: "https://placehold.co/300x400/png?text=Template+2", alt: "Template 2" },
    { id: 3, src: "https://placehold.co/300x400/png?text=Template+3", alt: "Template 3" },
    { id: 4, src: "https://placehold.co/300x400/png?text=Template+4", alt: "Template 4" },
    { id: 5, src: "https://placehold.co/300x400/png?text=Template+5", alt: "Template 5" },
    { id: 6, src: "https://placehold.co/300x400/png?text=Template+6", alt: "Template 6" },
    { id: 7, src: "https://placehold.co/300x400/png?text=Template+7", alt: "Template 7" },
    { id: 8, src: "https://placehold.co/300x400/png?text=Template+8", alt: "Template 8" },
  ];

  return (
    <div className="p-6 space-y-8 w-full">
      {/* Header */}
      <div className="flex justify-end">
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <IconPlus className="mr-2 h-4 w-4" /> Add Template
        </Button>
      </div>

      {/* Section 1 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-primary">Floral</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="relative group overflow-hidden rounded-lg border-2 border-transparent hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <img
                src={template.src}
                alt={template.alt}
                className="w-full h-auto object-cover aspect-[3/4]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-primary">Floral</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div
              key={`sec2-${template.id}`}
              className="relative group overflow-hidden rounded-lg border-2 border-transparent hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <img
                src={template.src}
                alt={template.alt}
                className="w-full h-auto object-cover aspect-[3/4]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
