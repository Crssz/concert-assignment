"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createConcert } from "../actions";
import { useRouter } from "next/navigation";
import { UnauthorizedError, BadRequestError, TooManyRequestsError } from "@/lib/api-error-handler";

// Zod schema matching the backend validation
const createConcertSchema = z.object({
  name: z.string().min(1, "Concert name is required").max(255, "Name must be less than 255 characters"),
  description: z.string().min(1, "Description is required").max(1000, "Description must be less than 1000 characters"),
  totalSeats: z.number().int("Total seats must be a whole number").min(1, "Must have at least 1 seat").max(10000, "Cannot exceed 10,000 seats"),
});

type CreateConcertForm = z.infer<typeof createConcertSchema>;

interface CreateConcertSectionProps {
  onConcertCreated?: () => void;
}

export function CreateConcertSection({ onConcertCreated }: CreateConcertSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateConcertForm>({
    resolver: zodResolver(createConcertSchema),
    defaultValues: {
      name: "",
      description: "",
      totalSeats: 100,
    },
  });

  const onSubmit = async (data: CreateConcertForm) => {
    setIsSubmitting(true);
    try {
      await createConcert(data);
      toast.success("Concert created successfully!");
      reset();
      onConcertCreated?.();
      router.refresh();
    } catch (error) {
      let errorMessage = "Failed to create concert";
      
      if (error instanceof UnauthorizedError) {
        errorMessage = "Please sign in to create concerts";
        router.push("/");
      } else if (error instanceof BadRequestError) {
        errorMessage = "Invalid concert data. Please check your inputs";
      } else if (error instanceof TooManyRequestsError) {
        const retryMessage = error.retryAfter 
          ? ` Please try again in ${error.retryAfter} seconds.`
          : " Please try again later.";
        errorMessage = "Too many requests." + retryMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error("Failed to create concert:", error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create New Concert</CardTitle>
        <CardDescription>
          Add a new concert to your venue. Fill in the details below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Concert Name *
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter concert name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description *
            </label>
            <textarea
              id="description"
              placeholder="Enter concert description"
              rows={4}
              className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:text-sm resize-none"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="totalSeats" className="text-sm font-medium">
              Total Seats *
            </label>
            <Input
              id="totalSeats"
              type="number"
              min="1"
              max="10000"
              placeholder="Enter total number of seats"
              {...register("totalSeats", { valueAsNumber: true })}
              aria-invalid={!!errors.totalSeats}
            />
            {errors.totalSeats && (
              <p className="text-sm text-destructive">{errors.totalSeats.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Maximum 10,000 seats allowed
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Creating..." : "Create Concert"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isSubmitting}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
