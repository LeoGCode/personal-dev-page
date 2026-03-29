"use client";

import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  collaborateFormSchema,
  type CollaborateFormData,
} from "@/lib/schemas/collaborate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function CollaborateForm() {
  const t = useTranslations("collaborate");
  const locale = useLocale();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CollaborateFormData>({
    resolver: zodResolver(collaborateFormSchema),
    defaultValues: {
      honeypot: "",
    },
  });

  async function onSubmit(data: CollaborateFormData) {
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/collaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle className="h-12 w-12 text-primary" />
        <h3 className="font-mono text-xl font-bold">{t("success_title")}</h3>
        <p className="max-w-md text-muted-foreground">
          {t("success_message")}
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="font-mono text-xl font-bold">{t("error_title")}</h3>
        <p className="max-w-md text-muted-foreground">
          {errorMessage || t("error_message")}
        </p>
        <Button variant="outline" onClick={() => setStatus("idle")}>
          {t("try_again")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" tabIndex={-1} {...register("honeypot")} />
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">{t("fields.name")}</Label>
        <Input
          id="name"
          placeholder={t("placeholders.name")}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{t("fields.email")}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t("placeholders.email")}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Collaboration Type */}
      <div className="space-y-2">
        <Label htmlFor="collaborationType">{t("fields.type")}</Label>
        <Select
          onValueChange={(value) =>
            setValue("collaborationType", value as CollaborateFormData["collaborationType"])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("placeholders.type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="project">{t("types.project")}</SelectItem>
            <SelectItem value="consulting">{t("types.consulting")}</SelectItem>
            <SelectItem value="opensource">{t("types.opensource")}</SelectItem>
            <SelectItem value="speaking">{t("types.speaking")}</SelectItem>
            <SelectItem value="other">{t("types.other")}</SelectItem>
          </SelectContent>
        </Select>
        {errors.collaborationType && (
          <p className="text-sm text-destructive">
            {errors.collaborationType.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t("fields.description")}</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder={t("placeholders.description")}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Budget (optional) */}
      <div className="space-y-2">
        <Label htmlFor="budget">
          {t("fields.budget")}{" "}
          <span className="text-muted-foreground">({t("optional")})</span>
        </Label>
        <Select
          onValueChange={(value) =>
            setValue("budget", value as CollaborateFormData["budget"])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("placeholders.budget")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unsure">{t("budgets.unsure")}</SelectItem>
            <SelectItem value="under_1k">{t("budgets.under_1k")}</SelectItem>
            <SelectItem value="1k_5k">{t("budgets.1k_5k")}</SelectItem>
            <SelectItem value="5k_15k">{t("budgets.5k_15k")}</SelectItem>
            <SelectItem value="over_15k">{t("budgets.over_15k")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline (optional) */}
      <div className="space-y-2">
        <Label htmlFor="timeline">
          {t("fields.timeline")}{" "}
          <span className="text-muted-foreground">({t("optional")})</span>
        </Label>
        <Select
          onValueChange={(value) =>
            setValue("timeline", value as CollaborateFormData["timeline"])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("placeholders.timeline")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no_rush">{t("timelines.no_rush")}</SelectItem>
            <SelectItem value="1_3_months">
              {t("timelines.1_3_months")}
            </SelectItem>
            <SelectItem value="3_6_months">
              {t("timelines.3_6_months")}
            </SelectItem>
            <SelectItem value="asap">{t("timelines.asap")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Referral (optional) */}
      <div className="space-y-2">
        <Label htmlFor="referral">
          {t("fields.referral")}{" "}
          <span className="text-muted-foreground">({t("optional")})</span>
        </Label>
        <Select
          onValueChange={(value) =>
            setValue("referral", value as CollaborateFormData["referral"])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("placeholders.referral")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google">{t("referrals.google")}</SelectItem>
            <SelectItem value="github">{t("referrals.github")}</SelectItem>
            <SelectItem value="linkedin">{t("referrals.linkedin")}</SelectItem>
            <SelectItem value="referral">{t("referrals.referral")}</SelectItem>
            <SelectItem value="other">{t("referrals.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}
