export default function HowItWorksPage() {
  const residentSteps = [
    "Submit Report",
    "Security Check",
    "Ticket Generated",
    "Volunteers Notified",
  ];

  const volunteerSteps = ["Login", "Receive Alerts", "Accept Case", "Update Status"];

  const securityItems = ["CAPTCHA", "Secure Authentication", "Protected Dashboard"];

  return (
    <div className="py-8">
      {/* Hero (KEEP THIS THE SAME) */}
      <section className="animate-fadeUp">
        <div className="rounded-3xl border border-black/5 bg-base p-7 shadow-sm">
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-secondary">
            🐾 Helping Davao care for stray animals
          </span>

          <h1 className="mt-4 text-4xl font-extrabold text-primary">
            How PawConnect Works
          </h1>

          <p className="mt-2 max-w-3xl text-secondary">
            PawConnect is a community-driven reporting and response system for stray
            animal concerns. Residents can submit reports without logging in, while
            verified volunteer groups receive alerts and manage cases through a
            protected dashboard.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/report"
              className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Report a Stray {/*→*/}
            </a>

            <a
              href="/status"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary ring-2 ring-primary/20 transition hover:ring-primary/40"
            >
              Track My Report
            </a>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {/* For Residents */}
          <div className="animate-fadeUp delay-100 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <h3 className="text-center text-sm font-extrabold tracking-wide text-primary">
              FOR RESIDENTS
            </h3>

            <ul className="mt-4 space-y-2 text-sm text-secondary">
              {residentSteps.map((item, i) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-base text-xs font-bold text-primary ring-1 ring-black/5">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* For Volunteers */}
          <div className="animate-fadeUp delay-200 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <h3 className="text-center text-sm font-extrabold tracking-wide text-primary">
              FOR VOLUNTEERS
            </h3>

            <ul className="mt-4 space-y-2 text-sm text-secondary">
              {volunteerSteps.map((item, i) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-base text-xs font-bold text-primary ring-1 ring-black/5">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Security & Protection */}
          <div className="animate-fadeUp delay-300 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <h3 className="text-center text-sm font-extrabold tracking-wide text-primary">
              SECURITY &amp; PROTECTION
            </h3>

            <ul className="mt-4 space-y-2 text-sm text-secondary">
              {securityItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      

      {/* Ready to Make a Difference */}
      <section className="mt-10">
        <div className="animate-fadeUp delay-300 rounded-3xl border border-black/5 bg-base p-8 text-center shadow-sm">
          <h2 className="text-2xl font-extrabold text-primary">
            Ready to Make a Difference?
          </h2>

          <p className="mx-auto mt-2 max-w-3xl text-secondary">
            Report a stray animal today or join as a volunteer group to help improve
            animal welfare in Davao City.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="/report"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Report a Stray
            </a>

            <a
              href="/volunteer/login"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary ring-2 ring-primary/20 transition hover:ring-primary/40"
            >
              Volunteers Login
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
