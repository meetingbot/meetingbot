"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { trpcReact } from "~/trpc/trpc-react";
import { DialogClose } from "~/components/ui/dialog";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  expiresIn: z.number().optional(),
});

type CreateApiKeyFormProps = {
  onSuccess?: () => void;
};

export function CreateApiKeyForm({ onSuccess }: CreateApiKeyFormProps) {
  const utils = trpcReact.useUtils();
  const createApiKey = trpcReact.apiKeys.createApiKey.useMutation({
    onSuccess: async () => {
      await utils.apiKeys.listApiKeys.invalidate();
      toast.success("API Key created", {
        description: "Your new API key has been created successfully.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      expiresIn: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await createApiKey.mutateAsync(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Production API Key" {...field} />
              </FormControl>
              <FormDescription>The name of the API key.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expiresIn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expires In (seconds)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="3600"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? undefined
                        : e.target.valueAsNumber;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormDescription>
                How long the API key should be valid for, in seconds. Leave
                empty for default expiration of 6 months.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={createApiKey.isLoading}>
            {createApiKey.isLoading ? "Creating..." : "Create API Key"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
