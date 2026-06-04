import { Card, CardContent } from "../ui/card";

export function ProfessionalCard() {
  return (
    <Card className="rounded-lg max-w-sm mx-auto border-0 bg-[linear-gradient(90deg,#155DFC_0%,#9810FA_100%)] text-white shadow-lg">
      <CardContent className="">
        <h3 className="text-sm font-semibold">For Healthcare Professionals</h3>
        <p className="mt-2 text-[11px] leading-4 text-white/90">
          Join our network of verified doctors and help patients get the care
          they need
        </p>

        <ul className="mt-4 space-y-2 text-[11px] text-white/90">
          <li className="flex items-center gap-2">
            <span>✓</span>
            <span>Access AI-analyzed patient cases</span>
          </li>
          <li className="flex items-center gap-2">
            <span>✓</span>
            <span>Streamlined patient management</span>
          </li>
          <li className="flex items-center gap-2">
            <span>✓</span>
            <span>Expand your practice reach</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}