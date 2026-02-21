import Image from "next/image";
import Link from "next/link";

const partners = [
  {
    name: "Happy Animals Club",
    location: "Philippines",
    description:
      "A volunteer-driven animal welfare group focused on rescuing, rehabilitating, and rehoming abandoned and abused animals.",
    highlights: [
      "Rescue and rehabilitation",
      "Foster care network",
      "Adoption drives",
      "Spay and neuter advocacy",
    ],
    logo: "/images/partners/partner2.png",
    link: "https://www.facebook.com/happy.animals.club.animal.shelter",
  },
  {
    name: "Bantay Hayop Davao",
    location: "Davao City, Philippines",
    description:
      "A Davao-based rescue organization working to protect stray and abused animals through rescue, treatment, and rehoming.",
    highlights: [
      "Street rescue operations",
      "Medical support",
      "Adoption matching",
      "Community education",
    ],
    logo: "/images/partners/partner1.jpg",
    link: "https://www.facebook.com/bantayhayopdavao",
  },
  {
    name: "Davao Animal Rescue Volunteers",
    location: "Davao City, Philippines",
    description:
      "A non-profit volunteer group responding to emergency cases and supporting long-term solutions like adoption and spay/neuter.",
    highlights: [
      "Emergency rescue response",
      "Veterinary care support",
      "Foster network",
      "Awareness campaigns",
    ],
    logo: "/images/partners/partner3.jpg",
    link: "https://www.facebook.com/davaoanimalrescuevolunteers",
  },
  {
    name: "ARRF-Davao Inc.",
    location: "Davao City, Philippines",
    description:
      "An established rescue organization providing shelter, rehabilitation, and adoption services while advocating humane treatment.",
    highlights: [
      "Shelter and rehabilitation",
      "Veterinary assistance",
      "Adoption services",
      "Spay and neuter initiatives",
    ],
    logo: "/images/partners/partner4.jpg",
    link: "https://www.facebook.com/arrfdavao",
  },
];

function normalizePartnerLink(rawLink) {
  const link = (rawLink || "").trim();
  if (!link) return "#";

  const cleaned = link.replace(/^#(?=https?:\/\/)/i, "");
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (cleaned.startsWith("www.")) return `https://${cleaned}`;

  return cleaned;
}

export default function PartnerGroupsPage() {
  return (
    <section className="w-full px-6 py-16 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="animate-fadeUp text-center">
          <p className="text-sm text-gray-500 md:text-base">Collaborating for animal welfare</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Meet Our Partners</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            We work with trusted rescue groups and volunteer organizations to support responsible
            pet care, rescues, and rehoming efforts.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {partners.map((partner, idx) => {
            const safeLink = normalizePartnerLink(partner.link);
            return (
            <article
              key={partner.name}
              className="animate-fadeUp group overflow-hidden rounded-3xl border border-gray-100 bg-white/70 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="relative h-32 w-full bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/40 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute left-5 top-5 flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <Image
                      src={partner.logo}
                      alt={`${partner.name} logo`}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold leading-tight">{partner.name}</h3>
                    <p className="text-xs text-gray-500">{partner.location}</p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <p className="text-sm leading-relaxed text-gray-600">{partner.description}</p>

                <ul className="mt-4 space-y-2">
                  {partner.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-gray-400" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  <a
                    href={safeLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </article>
            );
          })}
        </div>

        <div className="animate-fadeUp mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl border border-gray-100 bg-white/70 p-6 shadow-sm backdrop-blur md:flex-row md:items-center">
          <div>
            <h4 className="text-lg font-semibold">Want to become a partner?</h4>
            <p className="mt-1 text-sm text-gray-600">
              If you&apos;re a rescue group or volunteer organization, we&apos;d love to collaborate.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-medium transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
