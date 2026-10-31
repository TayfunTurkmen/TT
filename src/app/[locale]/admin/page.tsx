import { AdminPanel } from "@/components/AdminPanel";
import { getAdminAuthStatus, getAdminSession } from "@/lib/admin-auth";
import {
  getAdminAiSettings,
  getAdminSmtpSettings,
  getPublicSiteSettings,
  listAdminBlogPosts,
  listAppointmentRequests,
  listContactMessages,
  listCronRuns,
  pingD1,
} from "@/lib/d1";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return {
    title: t("title"),
    robots: { index: false, follow: false },
    alternates: { canonical: `/${locale}/admin` },
  };
}

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const auth = getAdminAuthStatus();
  const session = await getAdminSession();
  // Nothing from the database is read until the visitor has a valid session.
  const d1Connected = session ? Boolean(await pingD1()) : false;
  const load = Boolean(session) && d1Connected;

  const [posts, cronRuns, contactMessages, appointments, marketing, ai, smtp] = load
    ? await Promise.all([
        listAdminBlogPosts(100),
        listCronRuns(15),
        listContactMessages(80),
        listAppointmentRequests(100),
        getPublicSiteSettings(),
        getAdminAiSettings(),
        getAdminSmtpSettings(),
      ])
    : [[], [], [], [], null, null, null];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <AdminPanel
        // Remount on sign-in/sign-out so client state (active tab, drafts) starts fresh.
        key={session ? "signed-in" : "signed-out"}
        auth={auth}
        session={session}
        d1Connected={d1Connected}
        initialPosts={posts.map((p) => ({
          slug: p.slug,
          locale: p.locale,
          title: p.title,
          excerpt: p.excerpt,
          content: p.content,
          tags: p.tags,
          published: p.published,
          updatedAt: p.updatedAt,
          featuredImage: p.featuredImage,
          scheduledFor: p.scheduledFor,
        }))}
        initialCronRuns={cronRuns}
        initialSettings={{
          analyticsMeasurementId: marketing?.analyticsMeasurementId ?? "",
          aiApiBaseUrl: ai?.aiApiBaseUrl ?? "",
          aiModel: ai?.aiModel ?? "",
          hasAiApiKey: Boolean(ai?.aiApiKey),
        }}
        initialAppointments={appointments.map((a) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          preferredDate: a.preferredDate,
          preferredTime: a.preferredTime,
          topic: a.topic,
          locale: a.locale,
          status: a.status,
          createdAt: a.createdAt,
        }))}
        initialContactMessages={contactMessages.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          body: m.body,
          locale: m.locale,
          ip: m.ip,
          createdAt: m.createdAt,
        }))}
        initialSmtp={{
          hasBrevoApiKey: Boolean(smtp?.brevoApiKey),
          smtpHost: smtp?.smtpHost ?? "",
          smtpPort: smtp?.smtpPort ?? "587",
          smtpUser: smtp?.smtpUser ?? "",
          smtpFrom: smtp?.smtpFrom ?? "",
          contactNotifyEmail: smtp?.contactNotifyEmail ?? "",
          smtpSecure: Boolean(smtp?.smtpSecure),
          hasSmtpPassword: Boolean(smtp?.smtpPass),
        }}
      />
    </div>
  );
}
