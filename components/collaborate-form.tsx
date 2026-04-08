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
import { useState, useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function CollaborateForm() {
  const t = useTranslations("collaborate");
  const locale = useLocale();
  const posthog = usePostHog();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    posthog?.capture("collaborate_form_viewed");
  }, [posthog]);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
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
    posthog?.capture("collaborate_form_submitted", {
      collaboration_type: data.collaborationType,
    });

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

      posthog?.capture("collaborate_form_success", {
        collaboration_type: data.collaborationType,
      });
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      posthog?.capture("collaborate_form_error", {
        collaboration_type: data.collaborationType,
        error: message,
      });
      setErrorMessage(message);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-4 py-16 text-center"
      >
        <CheckCircle className="h-12 w-12 text-primary" />
        <h3 className="font-mono text-xl font-bold">{t("success_title")}</h3>
        <p className="max-w-md text-muted-foreground">{t("success_message")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (fieldErrors) => {
        const firstField = Object.keys(fieldErrors)[0] as
          | keyof CollaborateFormData
          | undefined;
        if (firstField) setFocus(firstField);
      })}
      className="space-y-6"
    >
      {/* Honeypot */}
      <div className="absolute -left-[9999px]">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          {...register("honeypot")}
        />
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">{t("fields.name")}</Label>
        <Input
          id="name"
          placeholder={t("placeholders.name")}
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{t("fields.email")}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t("placeholders.email")}
          autoComplete="email"
          spellCheck={false}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Collaboration Type */}
      <div className="space-y-2">
        <Label htmlFor="collaborationType">{t("fields.type")}</Label>
        <Select
          onValueChange={(value) =>
            setValue(
              "collaborationType",
              value as CollaborateFormData["collaborationType"],
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("placeholders.type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="project">{t("types.project")}</SelectItem>
            <SelectItem value="ai_agent">{t("types.ai_agent")}</SelectItem>
            <SelectItem value="consulting">{t("types.consulting")}</SelectItem>
            <SelectItem value="opensource">{t("types.opensource")}</SelectItem>
            <SelectItem value="speaking">{t("types.speaking")}</SelectItem>
            <SelectItem value="other">{t("types.other")}</SelectItem>
          </SelectContent>
        </Select>
        {errors.collaborationType && (
          <p id="type-error" className="text-sm text-destructive">
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
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? "description-error" : undefined
          }
          {...register("description")}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-destructive">
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

      {/* Inline error banner */}
      {status === "error" && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="font-mono text-sm font-medium">{t("error_title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {errorMessage || t("error_message")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="shrink-0 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {t("try_again")}
          </button>
        </div>
      )}

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
