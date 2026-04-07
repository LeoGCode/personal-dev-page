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
      en: "Multi-landing SaaS platform for a software consultancy. Config-driven architecture serving 22+ service landing pages from a single Next.js app.",
      es: "Plataforma SaaS multi-landing para una consultora de software. Arquitectura basada en configuración que sirve 22+ páginas de servicios desde una sola app Next.js.",
    },
    longDescription: {
      en: "Nexora Group is a full-stack SaaS platform built for a software consultancy that needed to scale its web presence across dozens of services without duplicating codebases. A single Next.js application drives 22+ landing pages through a configuration-driven architecture, where each service's content, layout, and metadata are defined declaratively. The platform integrates directly with Odoo CRM for lead management, uses PostgreSQL for persistent data, and runs as a containerized service behind Traefik on a shared Hetzner VPS.",
      es: "Nexora Group es una plataforma SaaS full-stack construida para una consultora de software que necesitaba escalar su presencia web a través de docenas de servicios sin duplicar código. Una sola aplicación Next.js alimenta 22+ páginas de aterrizaje mediante una arquitectura basada en configuración, donde el contenido, diseño y metadatos de cada servicio se definen declarativamente. La plataforma se integra directamente con Odoo CRM para gestión de leads, usa PostgreSQL para datos persistentes, y corre como un servicio contenedorizado detrás de Traefik en un VPS compartido de Hetzner.",
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
        "Config-driven architecture serving 22+ landing pages from a single codebase",
        "Odoo CRM integration for automated lead capture and management",
        "Containerized deployment with Traefik reverse proxy and CrowdSec security",
        "Shared infrastructure with PostgreSQL, Redis, and automated backups",
      ],
      es: [
        "Arquitectura basada en configuración sirviendo 22+ landing pages desde un solo codebase",
        "Integración con Odoo CRM para captura y gestión automatizada de leads",
        "Despliegue contenedorizado con Traefik como reverse proxy y seguridad CrowdSec",
        "Infraestructura compartida con PostgreSQL, Redis y backups automatizados",
      ],
    },
    live: "https://nexoragroup.com",
  },
  {
    slug: "ai-credit-analyzer",
    title: "AI Credit Analyzer",
    description: {
      en: "AI-powered credit analysis tool combining XGBoost models with Claude API for automated risk assessment and report generation.",
      es: "Herramienta de análisis crediticio potenciada por IA que combina modelos XGBoost con la API de Claude para evaluación de riesgo automatizada y generación de reportes.",
    },
    longDescription: {
      en: "The AI Credit Analyzer is a hybrid ML/LLM system designed for financial institutions that need fast, accurate credit risk assessments. It combines a trained XGBoost model for quantitative scoring with Claude API for qualitative narrative generation, producing comprehensive credit reports in seconds. The Django backend handles model inference and data pipelines, while the Next.js frontend provides an intuitive interface for analysts to review, adjust, and approve assessments.",
      es: "El AI Credit Analyzer es un sistema híbrido ML/LLM diseñado para instituciones financieras que necesitan evaluaciones de riesgo crediticio rápidas y precisas. Combina un modelo XGBoost entrenado para scoring cuantitativo con la API de Claude para generación narrativa cualitativa, produciendo reportes crediticios completos en segundos. El backend en Django maneja la inferencia del modelo y pipelines de datos, mientras el frontend en Next.js provee una interfaz intuitiva para que los analistas revisen, ajusten y aprueben evaluaciones.",
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
        "Hybrid ML/LLM pipeline combining XGBoost scoring with Claude API narrative generation",
        "Django backend with model inference and data processing pipelines",
        "Next.js frontend for analyst review and approval workflows",
        "Automated report generation reducing assessment time from hours to seconds",
      ],
      es: [
        "Pipeline híbrido ML/LLM combinando scoring XGBoost con generación narrativa de Claude API",
        "Backend en Django con inferencia de modelos y pipelines de procesamiento de datos",
        "Frontend en Next.js para flujos de revisión y aprobación de analistas",
        "Generación automatizada de reportes reduciendo el tiempo de evaluación de horas a segundos",
      ],
    },
  },
  {
    slug: "openclaw-mobile",
    title: "OpenClaw Mobile",
    description: {
      en: "Android accessibility app with LLM-powered device control, enabling hands-free interaction through natural language commands.",
      es: "App de accesibilidad Android con control de dispositivo potenciado por LLM, habilitando interacción manos libres mediante comandos en lenguaje natural.",
    },
    longDescription: {
      en: "OpenClaw Mobile is an Android accessibility application that leverages large language models to provide hands-free device control through natural language. Users can navigate apps, compose messages, and perform complex multi-step actions using voice commands that are interpreted by an LLM and translated into accessibility service actions. The app is designed for users with motor disabilities but benefits anyone who needs hands-free phone interaction.",
      es: "OpenClaw Mobile es una aplicación de accesibilidad Android que aprovecha modelos de lenguaje para proveer control del dispositivo manos libres a través de lenguaje natural. Los usuarios pueden navegar apps, componer mensajes y realizar acciones complejas de múltiples pasos usando comandos de voz que son interpretados por un LLM y traducidos en acciones del servicio de accesibilidad. La app está diseñada para usuarios con discapacidades motrices pero beneficia a cualquiera que necesite interacción manos libres con el teléfono.",
    },
    status: "planned",
    tech: ["Kotlin", "Android", "LLM", "Accessibility API", "Room DB"],
    highlights: {
      en: [
        "LLM-powered natural language interpretation for device control",
        "Android Accessibility Service integration for system-wide interaction",
        "Multi-step action chaining from single voice commands",
        "Designed for motor disability accessibility with universal appeal",
      ],
      es: [
        "Interpretación de lenguaje natural potenciada por LLM para control del dispositivo",
        "Integración con Android Accessibility Service para interacción a nivel de sistema",
        "Encadenamiento de acciones de múltiples pasos desde comandos de voz individuales",
        "Diseñado para accesibilidad de discapacidad motriz con atractivo universal",
      ],
    },
  },
  {
    slug: "electricity-billing",
    title: "Electricity Billing Analyzer",
    description: {
      en: "Utility plan analysis tool with OCR bill scanning and cost simulation to help users find the most cost-effective electricity plan.",
      es: "Herramienta de análisis de planes de servicios con escaneo OCR de facturas y simulación de costos para ayudar a encontrar el plan eléctrico más económico.",
    },
    longDescription: {
      en: "The Electricity Billing Analyzer helps consumers and small businesses understand their electricity costs and find better rate plans. Users scan their bills using OCR, and the system extracts consumption data to simulate costs across available utility plans. The tool accounts for time-of-use rates, seasonal variations, and demand charges to provide accurate cost projections and savings estimates.",
      es: "El Electricity Billing Analyzer ayuda a consumidores y pequeñas empresas a entender sus costos eléctricos y encontrar mejores planes tarifarios. Los usuarios escanean sus facturas usando OCR, y el sistema extrae datos de consumo para simular costos en los planes disponibles. La herramienta considera tarifas por horario de uso, variaciones estacionales y cargos por demanda para proveer proyecciones de costo precisas y estimaciones de ahorro.",
    },
    status: "in_progress",
    tech: ["Python", "FastAPI", "OCR", "Next.js", "TypeScript", "PostgreSQL"],
    highlights: {
      en: [
        "OCR-based bill scanning for automatic consumption data extraction",
        "Cost simulation across multiple utility rate plans",
        "Time-of-use and seasonal rate analysis",
        "Savings projections with plan switching recommendations",
      ],
      es: [
        "Escaneo de facturas basado en OCR para extracción automática de datos de consumo",
        "Simulación de costos en múltiples planes tarifarios",
        "Análisis de tarifas por horario de uso y variaciones estacionales",
        "Proyecciones de ahorro con recomendaciones de cambio de plan",
      ],
    },
  },
  {
    slug: "esthetician",
    title: "Esthetician Platform",
    description: {
      en: "Digital presence platform for beauty professionals with online booking, client CRM, and automated appointment communications.",
      es: "Plataforma de presencia digital para profesionales de belleza con reservas online, CRM de clientes y comunicaciones automatizadas de citas.",
    },
    longDescription: {
      en: "The Esthetician Platform is a complete digital solution for beauty and skincare professionals who need a professional online presence without the complexity of enterprise software. It combines a customizable public-facing website with an integrated booking system, client CRM, and automated communications. Clients can browse services, book appointments, and receive reminders, while the professional manages everything from a single dashboard.",
      es: "La Plataforma para Esteticistas es una solución digital completa para profesionales de belleza y cuidado de la piel que necesitan una presencia online profesional sin la complejidad del software empresarial. Combina un sitio web público personalizable con un sistema de reservas integrado, CRM de clientes y comunicaciones automatizadas. Los clientes pueden explorar servicios, reservar citas y recibir recordatorios, mientras el profesional gestiona todo desde un solo panel.",
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
        "Customizable public website for professional branding",
        "Integrated booking system with calendar management",
        "Client CRM with appointment history and preferences",
        "Automated email reminders and follow-ups via Resend",
      ],
      es: [
        "Sitio web público personalizable para branding profesional",
        "Sistema de reservas integrado con gestión de calendario",
        "CRM de clientes con historial de citas y preferencias",
        "Recordatorios y seguimientos automatizados por email vía Resend",
      ],
    },
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getAllProjectSlugs(): string[] {
  return projects.map((p) => p.slug);
}
