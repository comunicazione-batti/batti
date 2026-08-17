import { TopBar } from "@/components/TopBar";
import { Scanner } from "@/components/Scanner";

export default function CheckinEventPage({ params }: { params: { eventId: string } }) {
  return (
    <>
      <TopBar title="Check-in" backHref="/" />
      <Scanner eventId={params.eventId} />
    </>
  );
}
