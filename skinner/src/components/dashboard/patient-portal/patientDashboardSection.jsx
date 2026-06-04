import PatientTabsSection from "./patientTabsSection";

export default function PatientDashboardSection() {
  return (
    <section className="w-full py-7 md:py-8">
      <div className="mx-auto max-w-[1120px] px-4 md:px-6">
        <PatientTabsSection />
      </div>
    </section>
  );
}
