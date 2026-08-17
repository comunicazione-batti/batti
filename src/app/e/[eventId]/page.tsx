import { TopBar } from "@/components/TopBar";
import { GuestFlow } from "@/components/GuestFlow";

export default function GuestEventPage({ params }: { params: { eventId: string } }) {
  return (
    <>
      <TopBar title="Invitato" backHref="/" />
      <GuestFlow eventId={params.eventId} />
    </>
  );
}
