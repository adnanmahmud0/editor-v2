/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { categoriesData } from "../../../../public/categoriesData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconEdit, IconTrash, IconPlus, IconX } from "@tabler/icons-react";

interface CategoryField {
  id: string;
  name: string;
  key: string;
  type: string;
  values: string[];
  required: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  features: string[];
  specifications: {
    title: string;
    details: string;
  };
  image: string;
  imageAlt: string;
  url: string;
  fields: CategoryField[];
  pricing: {
    type: string;
    prices: any;
  };
}

// Helper to generate Cartesian product of arrays
const cartesian = (...a: any[][]): any[][] =>
  a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));

export default function CategoriesPage() {
  // Cast the imported data to the mutable Category type
  const [categories, setCategories] = useState<Category[]>(
    categoriesData as unknown as Category[],
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      setCategories(categories.filter((cat) => cat.id !== id));
    }
  };

  const handleEdit = (category: Category) => {
    setCurrentCategory(JSON.parse(JSON.stringify(category))); // Deep copy
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentCategory({
      id: `cat-${Math.floor(Math.random() * 1000)}`,
      features: [],
      specifications: { title: "", details: "" },
      fields: [],
      pricing: { type: "table", prices: {} },
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    try {
      const categoryToSave = {
        ...currentCategory,
      } as Category;

      if (isEditing) {
        setCategories(
          categories.map((cat) =>
            cat.id === categoryToSave.id ? categoryToSave : cat,
          ),
        );
      } else {
        setCategories([...categories, categoryToSave]);
      }
      setIsDialogOpen(false);
    } catch (e) {
      alert("Error saving category");
    }
  };

  const addFeature = () => {
    const features = currentCategory.features || [];
    setCurrentCategory({ ...currentCategory, features: [...features, ""] });
  };

  const updateFeature = (index: number, value: string) => {
    const features = [...(currentCategory.features || [])];
    features[index] = value;
    setCurrentCategory({ ...currentCategory, features });
  };

  const removeFeature = (index: number) => {
    const features = [...(currentCategory.features || [])];
    features.splice(index, 1);
    setCurrentCategory({ ...currentCategory, features });
  };

  const addField = () => {
    const fields = currentCategory.fields || [];
    setCurrentCategory({
      ...currentCategory,
      fields: [
        ...fields,
        {
          id: `f-${Math.floor(Math.random() * 1000)}`,
          name: "",
          key: "",
          type: "select",
          values: [],
          required: false,
        },
      ],
    });
  };

  const updateField = (index: number, field: CategoryField) => {
    const fields = [...(currentCategory.fields || [])];
    fields[index] = field;
    setCurrentCategory({ ...currentCategory, fields });
  };

  const removeField = (index: number) => {
    const fields = [...(currentCategory.fields || [])];
    fields.splice(index, 1);
    setCurrentCategory({ ...currentCategory, fields });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setCurrentCategory({ ...currentCategory, image: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePricingTemplate = () => {
    const fields = currentCategory.fields || [];
    const selectFields = fields.filter((f) => f.type === "select");

    // Initialize nested prices structure if needed, or just reset to empty
    // For N-dimensions, we just need to ensure the object structure exists
    // But since we are building it dynamically in the UI, we might not need to pre-populate everything
    // However, it's good to reset it.
    const newPricing = {
      type: "table",
      prices: {},
    };

    setCurrentCategory({ ...currentCategory, pricing: newPricing });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <Button onClick={handleAdd}>
          <IconPlus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.id}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell className="max-w-md truncate">
                  {category.description}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(category.id)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              Make changes to the category details here. Click save when you're
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={currentCategory.name || ""}
                    onChange={(e) =>
                      setCurrentCategory({
                        ...currentCategory,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea
                    id="description"
                    value={currentCategory.description || ""}
                    onChange={(e) =>
                      setCurrentCategory({
                        ...currentCategory,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="longDescription">Long Description</Label>
                  <Textarea
                    id="longDescription"
                    className="h-24"
                    value={currentCategory.longDescription || ""}
                    onChange={(e) =>
                      setCurrentCategory({
                        ...currentCategory,
                        longDescription: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Media & URL */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Media & URL</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Image</Label>
                  <div className="flex flex-col gap-3">
                    {currentCategory.image && (
                      <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                        <img
                          src={currentCategory.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload an image file.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specTitle">Title</Label>
                  <Input
                    id="specTitle"
                    value={currentCategory.specifications?.title || ""}
                    onChange={(e) =>
                      setCurrentCategory({
                        ...currentCategory,
                        specifications: {
                          title: e.target.value,
                          details:
                            currentCategory.specifications?.details || "",
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specDetails">Details</Label>
                  <Input
                    id="specDetails"
                    value={currentCategory.specifications?.details || ""}
                    onChange={(e) =>
                      setCurrentCategory({
                        ...currentCategory,
                        specifications: {
                          title: currentCategory.specifications?.title || "",
                          details: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Features</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeature}
                >
                  <IconPlus className="h-4 w-4 mr-1" /> Add Feature
                </Button>
              </div>
              <div className="space-y-2">
                {currentCategory.features?.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Feature description"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFeature(index)}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Fields */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Input Fields</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addField}
                >
                  <IconPlus className="h-4 w-4 mr-1" /> Add Field
                </Button>
              </div>
              <div className="space-y-4">
                {currentCategory.fields?.map((field, index) => (
                  <div
                    key={index}
                    className="border p-4 rounded-md space-y-4 relative"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeField(index)}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            const key = name
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, "");
                            updateField(index, {
                              ...field,
                              name,
                              key,
                            });
                          }}
                          placeholder="e.g. Quantity"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Required</Label>
                        <div className="flex items-center space-x-2 h-10">
                          <Checkbox
                            id={`required-${index}`}
                            checked={field.required}
                            onCheckedChange={(checked) =>
                              updateField(index, {
                                ...field,
                                required: checked as boolean,
                              })
                            }
                          />
                          <label htmlFor={`required-${index}`}>
                            Is Required
                          </label>
                        </div>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Values (comma separated)</Label>
                        <Input
                          value={field.values.join(", ")}
                          onChange={(e) =>
                            updateField(index, {
                              ...field,
                              values: e.target.value
                                .split(",")
                                .map((v) => v.trim()),
                            })
                          }
                          placeholder="e.g. 50, 100, 200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Configuration */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Pricing Configuration</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePricingTemplate}
                >
                  <IconPlus className="h-4 w-4 mr-1" /> Reset Pricing Table
                </Button>
              </div>

              {(() => {
                const selectFields = (currentCategory.fields || []).filter(
                  (f) => f.type === "select",
                );
                const prices = currentCategory.pricing?.prices || {};

                if (selectFields.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground border p-4 rounded-md">
                      Add "select" fields in the Input Fields section to
                      configure pricing tables.
                    </p>
                  );
                }

                // Generate Cartesian product of all field values
                const fieldValues = selectFields.map((f) => f.values);
                const combinations = cartesian(...fieldValues);

                // Helper to get/set deep value
                const getDeepValue = (obj: any, path: string[]) => {
                  let current = obj;
                  for (let i = 0; i < path.length; i++) {
                    if (current === undefined || current === null)
                      return undefined;
                    current = current[path[i]];
                  }
                  return current;
                };

                const setDeepValue = (
                  obj: any,
                  path: string[],
                  value: number,
                ) => {
                  const newObj = JSON.parse(JSON.stringify(obj));
                  let current = newObj;
                  for (let i = 0; i < path.length - 1; i++) {
                    const key = path[i];
                    if (!current[key]) current[key] = {};
                    current = current[key];
                  }
                  current[path[path.length - 1]] = value;
                  return newObj;
                };

                return (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {selectFields.map((field) => (
                            <TableHead key={field.id}>{field.name}</TableHead>
                          ))}
                          <TableHead className="w-[150px]">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {combinations.map((combo, idx) => (
                          <TableRow key={idx}>
                            {combo.map((val: string, valIdx: number) => (
                              <TableCell key={valIdx}>{val}</TableCell>
                            ))}
                            <TableCell>
                              <Input
                                type="number"
                                value={getDeepValue(prices, combo) || 0}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value);
                                  const newPrices = setDeepValue(
                                    prices,
                                    combo,
                                    newVal,
                                  );
                                  setCurrentCategory({
                                    ...currentCategory,
                                    pricing: {
                                      ...currentCategory.pricing!,
                                      prices: newPrices,
                                      type: "table",
                                    },
                                  });
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
