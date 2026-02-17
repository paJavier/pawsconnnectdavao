export default function Footer() {
  return (
    <footer className="w-full border-t bg-white">
      <div className="mx-auto max-w-6xl p-4 text-sm text-gray-600">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PawsConnect Davao</p>
          <p>
            SDG 11: Sustainable Cities • SDG 15: Life on Land
          </p>
        </div>
      </div>
    </footer>
  );
}
