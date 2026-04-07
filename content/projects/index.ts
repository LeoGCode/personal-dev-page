import { cache } from "react";
import type { ProjectStatus } from "@/lib/shared/status-styles";

interface LocalizedText {
  en: string;
  es: string;
  [key: string]: string;
}

interface LocalizedList {
  en: string[];
  es: string[];
  [key: string]: string[];
}

export interface Project {
  slug: string;
  title: string;
  description: LocalizedText;
  longDescription: LocalizedText;
  status: ProjectStatus;
  tech: string[];
  highlights: LocalizedList;
  github?: string;
  live?: string;
  image?: string;
}

export const projects: Project[] = [
  {
    slug: "nexora-group",
    title: "Nexora Group",
    description: {
      en: "Full-stack SaaS platform I built end-to-end — a single Next.js app serving 22+ branded landing pages through config-driven architecture, with AI-powered lead qualification piped into Odoo CRM.",
      es: "Plataforma SaaS full-stack que construí de punta a punta — una sola app Next.js sirviendo 22+ landing pages con arquitectura config-driven e integración de IA para calificación de leads conectada a Odoo CRM.",
    },
    longDescription: {
      en: "I built Nexora Group end-to-end as a one-person team — from infrastructure to production. It's a full-stack SaaS platform that scales a software consultancy's web presence across dozens of services without duplicating code. A single Next.js application drives 22+ branded landing pages through a configuration-driven architecture. I set up the entire infrastructure: PostgreSQL database, Redis caching, Docker containerization, Traefik reverse proxy with CrowdSec security, and automated backups. Then I integrated AI-powered lead qualification pipelines that automatically score and route leads into Odoo CRM — turning what used to be manual work into an automated workflow.",
      es: "Construí Nexora Group de punta a punta como equipo de una persona — desde infraestructura hasta producción. Es una plataforma SaaS full-stack que escala la presencia web de una consultora de software sin duplicar código. Una sola app Next.js alimenta 22+ landing pages mediante arquitectura config-driven. Monté toda la infraestructura: base de datos PostgreSQL, caché Redis, contenedorización Docker, reverse proxy Traefik con seguridad CrowdSec y backups automatizados. Luego integré pipelines de calificación de leads con IA que automáticamente puntúan y rutean leads a Odoo CRM — convirtiendo trabajo manual en un flujo automatizado.",
    },
    status: "active",
    tech: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Odoo",
      "PostgreSQL",
      "Docker",
      "Traefik",
      "Redis",
    ],
    highlights: {
      en: [
        "Shipped solo — from infrastructure setup to production deployment",
        "Config-driven architecture serving 22+ branded landing pages from a single codebase",
        "Full DevOps: Docker, Traefik reverse proxy, CrowdSec security, automated backups",
        "AI-powered lead qualification automating what was previously manual CRM work",
      ],
      es: [
        "Entregado solo — desde setup de infraestructura hasta deployment en producción",
        "Arquitectura config-driven sirviendo 22+ landing pages desde un solo codebase",
        "DevOps completo: Docker, Traefik reverse proxy, seguridad CrowdSec, backups automatizados",
        "Calificación de leads con IA automatizando trabajo CRM que antes era manual",
      ],
    },
    live: "https://nexoragroup.com",
  },
  {
    slug: "ai-credit-analyzer",
    title: "AI Credit Analyzer",
    description: {
      en: "End-to-end credit analysis platform for financial institutions — Django backend, Next.js frontend, and AI integration (XGBoost + Claude API) that cut assessment time from hours to seconds.",
      es: "Plataforma de análisis crediticio de punta a punta para instituciones financieras — backend Django, frontend Next.js e integración de IA (XGBoost + Claude API) que redujo el tiempo de evaluación de horas a segundos.",
    },
    longDescription: {
      en: "I built the AI Credit Analyzer as a complete product for financial institutions that need fast, accurate credit risk assessments. The Django backend handles data ingestion, processing pipelines, and model inference. The Next.js frontend gives analysts an intuitive interface to review, adjust, and approve assessments. Then I layered in AI to make the product 10x more powerful: an XGBoost model handles quantitative scoring while Claude API generates qualitative narrative reports — producing comprehensive credit assessments in seconds instead of hours.",
      es: "Construí el AI Credit Analyzer como un producto completo para instituciones financieras que necesitan evaluaciones de riesgo rápidas y precisas. El backend Django maneja ingesta de datos, pipelines de procesamiento e inferencia de modelos. El frontend Next.js da a los analistas una interfaz intuitiva para revisar, ajustar y aprobar evaluaciones. Luego integré IA para hacer el producto 10x más potente: un modelo XGBoost maneja el scoring cuantitativo mientras Claude API genera reportes narrativos — produciendo evaluaciones completas en segundos en lugar de horas.",
    },
    status: "in_progress",
    tech: [
      "Python",
      "Django",
      "XGBoost",
      "Claude API",
      "Next.js",
      "TypeScript",
      "PostgreSQL",
    ],
    highlights: {
      en: [
        "Full product built solo: Django backend, Next.js frontend, PostgreSQL database",
        "AI integration: XGBoost scoring + Claude API narrative generation",
        "Analyst workflow with review, adjustment, and approval interfaces",
        "Reduced assessment time from hours to seconds with automated report generation",
      ],
      es: [
        "Producto completo construido solo: backend Django, frontend Next.js, base de datos PostgreSQL",
        "Integración de IA: scoring XGBoost + generación narrativa con Claude API",
        "Flujo de trabajo para analistas con interfaces de revisión, ajuste y aprobación",
        "Tiempo de evaluación reducido de horas a segundos con generación automatizada de reportes",
      ],
    },
  },
  {
    slug: "openclaw-mobile",
    title: "OpenClaw Mobile",
    description: {
      en: "Android accessibility app I'm building for hands-free device interaction — Kotlin native app with LLM integration that translates voice commands into system-wide actions.",
      es: "App de accesibilidad Android que estoy construyendo para interacción manos libres — app nativa Kotlin con integración de LLM que traduce comandos de voz en acciones del sistema.",
    },
    longDescription: {
      en: "I'm building OpenClaw Mobile as a native Android app for users with motor disabilities who need hands-free phone interaction. The product is built with Kotlin, integrates with Android's Accessibility Service for system-wide device control, and uses Room DB for local data persistence. The AI layer is what makes it powerful: an LLM interprets natural language voice commands and translates them into accessibility actions, enabling users to navigate apps, compose messages, and chain complex multi-step actions from a single voice command.",
      es: "Estoy construyendo OpenClaw Mobile como una app Android nativa para usuarios con discapacidades motrices que necesitan interacción manos libres. El producto está construido con Kotlin, se integra con el Accessibility Service de Android para control del dispositivo y usa Room DB para persistencia local. La capa de IA es lo que lo hace potente: un LLM interpreta comandos de voz en lenguaje natural y los traduce en acciones de accesibilidad, permitiendo navegar apps, componer mensajes y encadenar acciones complejas desde un solo comando de voz.",
    },
    status: "planned",
    tech: ["Kotlin", "Android", "LLM", "Accessibility API", "Room DB"],
    highlights: {
      en: [
        "Native Kotlin Android app with Accessibility Service integration",
        "Room DB for local data persistence and offline capability",
        "LLM integration translating natural language into device actions",
        "Multi-step action chaining from single voice commands",
      ],
      es: [
        "App Android nativa en Kotlin con integración de Accessibility Service",
        "Room DB para persistencia local y capacidad offline",
        "Integración de LLM traduciendo lenguaje natural en acciones del dispositivo",
        "Encadenamiento de acciones de múltiples pasos desde comandos de voz individuales",
      ],
    },
  },
  {
    slug: "electricity-billing",
    title: "Electricity Billing Analyzer",
    description: {
      en: "Utility bill analysis platform — FastAPI backend, Next.js frontend, PostgreSQL database — with an AI-powered pipeline (OCR + LLMs) that extracts bill data and simulates cost savings across plans.",
      es: "Plataforma de análisis de facturas eléctricas — backend FastAPI, frontend Next.js, base de datos PostgreSQL — con pipeline de IA (OCR + LLMs) que extrae datos y simula ahorros entre planes.",
    },
    longDescription: {
      en: "I'm building this as a complete product that helps consumers and small businesses find the most cost-effective electricity plan. The FastAPI backend handles data processing and simulation engines, the Next.js frontend provides an intuitive upload and comparison interface, and PostgreSQL stores consumption history. The AI layer is what makes it powerful: an autonomous pipeline uses OCR to scan uploaded bills, then LLMs extract and structure consumption data, which feeds into simulation engines comparing costs across utility plans — accounting for time-of-use rates, seasonal variations, and demand charges.",
      es: "Estoy construyendo esto como un producto completo que ayuda a consumidores y empresas a encontrar el plan eléctrico más económico. El backend FastAPI maneja procesamiento de datos y motores de simulación, el frontend Next.js provee una interfaz intuitiva de carga y comparación, y PostgreSQL almacena el historial de consumo. La capa de IA es lo que lo hace potente: un pipeline autónomo usa OCR para escanear facturas, luego LLMs extraen y estructuran datos de consumo que alimentan simulaciones comparando costos entre planes — considerando tarifas por horario, variaciones estacionales y cargos por demanda.",
    },
    status: "in_progress",
    tech: ["Python", "FastAPI", "OCR", "Next.js", "TypeScript", "PostgreSQL"],
    highlights: {
      en: [
        "Full-stack product: FastAPI backend, Next.js frontend, PostgreSQL database",
        "AI-powered document pipeline: OCR scanning + LLM data extraction",
        "Cost simulation engine comparing multiple utility rate plans",
        "Savings projections with actionable plan switching recommendations",
      ],
      es: [
        "Producto full-stack: backend FastAPI, frontend Next.js, base de datos PostgreSQL",
        "Pipeline de documentos con IA: escaneo OCR + extracción de datos con LLM",
        "Motor de simulación de costos comparando múltiples planes tarifarios",
        "Proyecciones de ahorro con recomendaciones accionables de cambio de plan",
      ],
    },
  },
  {
    slug: "esthetician",
    title: "Esthetician Platform",
    description: {
      en: "Complete SaaS product for beauty professionals — Next.js app with booking system, client CRM, automated email communications, and a customizable public-facing website.",
      es: "Producto SaaS completo para profesionales de belleza — app Next.js con sistema de reservas, CRM de clientes, comunicaciones automatizadas y sitio web público personalizable.",
    },
    longDescription: {
      en: "I'm building the Esthetician Platform as a complete digital product for beauty and skincare professionals who need a professional online presence without enterprise software complexity. It's a full-stack Next.js application with PostgreSQL (via Drizzle ORM), combining a customizable public website, integrated booking system, client CRM, and automated email communications via Resend. Clients browse services, book appointments, and receive reminders — while the professional manages everything from a single dashboard. A product built end-to-end by one engineer.",
      es: "Estoy construyendo la Plataforma para Esteticistas como un producto digital completo para profesionales de belleza que necesitan presencia online profesional sin la complejidad del software empresarial. Es una app full-stack Next.js con PostgreSQL (via Drizzle ORM), combinando sitio web personalizable, sistema de reservas, CRM de clientes y comunicaciones automatizadas por email vía Resend. Los clientes exploran servicios, reservan citas y reciben recordatorios — mientras el profesional gestiona todo desde un solo panel. Un producto construido de punta a punta por un solo ingeniero.",
    },
    status: "planned",
    tech: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "PostgreSQL",
      "Resend",
      "Drizzle ORM",
    ],
    highlights: {
      en: [
        "End-to-end product: frontend, backend, database, and email infrastructure",
        "Integrated booking system with calendar management",
        "Client CRM with appointment history and preferences",
        "Automated email reminders and follow-ups via Resend",
      ],
      es: [
        "Producto de punta a punta: frontend, backend, base de datos e infraestructura de email",
        "Sistema de reservas integrado con gestión de calendario",
        "CRM de clientes con historial de citas y preferencias",
        "Recordatorios y seguimientos automatizados por email vía Resend",
      ],
    },
  },
];

export const getProjectBySlug = cache(function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
});

export function getAllProjectSlugs(): string[] {
  return projects.map((p) => p.slug);
}
