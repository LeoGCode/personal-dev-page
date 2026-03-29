import { pgTable, serial, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  collaborationType: text("collaboration_type").notNull(),
  description: text("description").notNull(),
  budget: text("budget"),
  timeline: text("timeline"),
  referral: text("referral"),
  locale: text("locale").notNull().default("en"),
  odooLeadId: integer("odoo_lead_id"),
  extraFields: jsonb("extra_fields"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
