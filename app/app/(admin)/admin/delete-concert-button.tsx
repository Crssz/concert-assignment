"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { deleteConcert } from "../actions";
import { useRouter } from "next/navigation";
import { NotFoundError, UnauthorizedError } from "@/lib/api-error-handler";

interface DeleteConcertButtonProps {
  concertId: string;
  concertName: string;
}

export function DeleteConcertButton({
  concertId,
  concertName,
}: DeleteConcertButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDeleteConcert = async () => {
    try {
      setIsDeleting(true);

      await deleteConcert(concertId);
      toast.success("Concert deleted successfully");

      // Refresh the page to show updated data
      router.refresh();
    } catch (err) {
      let errorMessage = "Failed to delete concert";
      
      if (err instanceof NotFoundError) {
        errorMessage = "Concert not found or you don't have permission to delete it";
        router.refresh();
      } else if (err instanceof UnauthorizedError) {
        errorMessage = "Please sign in to delete concerts";
        router.push("/");
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isDeleting}
      className="text-destructive hover:text-destructive cursor-pointer disabled:cursor-not-allowed hover:bg-destructive/10 border-destructive/10"
    >
      {isDeleting ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div>
              <Trash2 className="w-4 h-4" />
            </div>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure to delete?
                <br />
                {concertName}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConcert}
                className="bg-destructive cursor-pointer text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Button>
  );
}
