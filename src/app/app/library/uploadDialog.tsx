"use client";

import { useState } from "react";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import For from "@/components/logics/forData";
import { createUpload, isUploadSuccess } from "@/network/uploads";
import {
  DOC_TYPES,
  FILE_INPUT_ACCEPT,
  MAX_UPLOAD_BYTES,
  type DocType,
} from "@/constants/uploads";
import { t, format } from "@/lib/i18n";
import type { PublicUpload } from "@/@types/database/uploads";

type ErrorKey = keyof ReturnType<typeof t>["app"]["library"]["errors"];

interface UploadDialogProps {
  onUploaded: (upload: PublicUpload) => void;
}

export function UploadDialog({ onUploaded }: UploadDialogProps) {
  const dict = t().app.library;
  const errorDict = dict.errors;
  const typeLabels = dict.types;
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [type, setType] = useState<DocType | "">("");

  function notifyError(code: ErrorKey) {
    toast.error(errorDict[code]);
  }

  function reset() {
    setType("");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const file = form.get("file");

    if (!name) return notifyError("invalid_name");
    if (!type) return notifyError("invalid_type");
    if (!(file instanceof File) || file.size === 0)
      return notifyError("missing_file");
    if (file.size > MAX_UPLOAD_BYTES) return notifyError("file_too_large");

    setPending(true);
    try {
      const result = await createUpload({ name, type, file });
      if (isUploadSuccess(result)) {
        toast.success(format(dict.successToast, { name: result.upload.name }));
        onUploaded(result.upload);
        setOpen(false);
        reset();
        return;
      }
      notifyError(result.error);
    } catch {
      notifyError("network_error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-neutral-900 text-white hover:bg-neutral-800">
          <UploadIcon className="h-4 w-4" />
          {dict.uploadButton}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{dict.dialogTitle}</DialogTitle>
            <DialogDescription>{dict.dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="upload-name" className="text-neutral-900">
              {dict.nameLabel}
            </Label>
            <Input
              id="upload-name"
              name="name"
              type="text"
              required
              minLength={1}
              maxLength={200}
              placeholder={dict.namePlaceholder}
              className="h-10 bg-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="upload-type" className="text-neutral-900">
              {dict.typeLabel}
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as DocType)}>
              <SelectTrigger id="upload-type" className="h-10 bg-white">
                <SelectValue placeholder={dict.typePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <For
                  data={DOC_TYPES as readonly DocType[] as DocType[]}
                  render={(t: DocType) => (
                    <SelectItem value={t}>{typeLabels[t]}</SelectItem>
                  )}
                />
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="upload-file" className="text-neutral-900">
              {dict.fileLabel}
            </Label>
            <Input
              id="upload-file"
              name="file"
              type="file"
              required
              accept={FILE_INPUT_ACCEPT}
              className="h-10 cursor-pointer bg-white file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:text-neutral-900 hover:file:bg-neutral-200"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {dict.cancel}
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-neutral-900 text-white hover:bg-neutral-800"
            >
              {pending ? dict.submitting : dict.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
