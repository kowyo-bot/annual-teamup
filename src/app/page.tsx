import { eq } from "drizzle-orm";

import { requireDb } from "@/db";
import { annualMeetingRegistrations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const db = user ? requireDb() : null;
  const [registration] = user
    ? await db!
        .select({ attending: annualMeetingRegistrations.attending })
        .from(annualMeetingRegistrations)
        .where(eq(annualMeetingRegistrations.userId, user.id))
        .limit(1)
    : [];

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-8 max-w-2xl w-full">
        {/* Decorative top */}
        <div className="text-5xl">🏮</div>

        <div className="space-y-3">
          <h1 className="text-4xl gala-heading tracking-wide">DeepWisdom 年会</h1>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-linear-to-r from-transparent to-red-primary/20" />
          <div className="text-red-primary/40 text-xs">✦</div>
          <div className="h-px w-16 bg-linear-to-l from-transparent to-red-primary/20" />
        </div>

        <div className="flex justify-center">
          <HomeClient
            user={user ? { name: user.name, email: user.email } : null}
            initialRegistered={!!registration}
            initialAttending={registration?.attending ?? null}
          />
        </div>
      </div>
    </main>
  );
}
