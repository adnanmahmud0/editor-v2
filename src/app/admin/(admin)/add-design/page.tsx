"use client";

import { useState } from "react";
import { categoriesData } from "../../../../../public/categoriesData";
import { Button } from "@/components/ui/button";
import { IconPlus, IconArrowLeft } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Template {
  id: string;
  src: string;
  alt: string;
}

interface CategoryTemplates {
  [categoryId: string]: Template[];
}

export default function AddDesignPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [templates] = useState<CategoryTemplates>({
    "cat-001": [
      { id: "t-1", src: "https://placehold.co/300x400/png?text=Booklet+1", alt: "Booklet Template 1" },
      { id: "t-2", src: "https://placehold.co/300x400/png?text=Booklet+2", alt: "Booklet Template 2" },
    ],
    "cat-002": [
        { id: "t-3", src: "https://placehold.co/300x400/png?text=Folded+1", alt: "Folded Card Template 1" },
    ],
    "cat-003": [],
    "cat-004": [],
  });
  
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  const selectedCategoryData = categoriesData.find((c) => c.id === selectedCategory);

  return (
    <div className="p-6 space-y-6 w-full">
      {!selectedCategory ? (
        // Category Selection View
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Select a Category</h1>
          <p className="text-muted-foreground">
            Choose a category to manage its design templates.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categoriesData.map((category) => (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={category.image} 
                        alt={category.imageAlt}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        // Template Management View
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handleBack}>
                    <IconArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{selectedCategoryData?.name} Templates</h1>
                    <p className="text-muted-foreground">
                        Manage design templates for {selectedCategoryData?.name}.
                    </p>
                </div>
                <div className="ml-auto">
                    <Button asChild>
                        <Link href="/admin/admin-editor">
                            <IconPlus className="mr-2 h-4 w-4" /> Add Template
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {(templates[selectedCategory] || []).length > 0 ? (
                    templates[selectedCategory].map((template) => (
                        <Link
                            href="/admin/admin-editor"
                            key={template.id}
                            className="relative group overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all block"
                        >
                            <div className="aspect-[3/4] w-full overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={template.src}
                                    alt={template.alt}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-medium truncate">{template.alt}</p>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No templates found for this category.</p>
                        <Button variant="link" asChild>
                            <Link href="/admin/admin-editor">Add your first template</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
