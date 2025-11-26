export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-700 py-6 mt-auto bg-white dark:bg-zinc-900">
      <div className="max-w-[1600px] mx-auto px-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-4 text-sm text-zinc-400 flex-wrap justify-center">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#3C6098] hover:underline cursor-pointer"
            >
              Privacy Policy
            </a>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <a
              href="https://github.com/Javihaus/cert-framework"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#3C6098] hover:underline cursor-pointer"
            >
              GitHub
            </a>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <a
              href="mailto:javier@jmarin.info"
              className="hover:text-[#3C6098] hover:underline cursor-pointer"
            >
              Contact
            </a>
          </div>
          <p className="text-sm text-zinc-400 text-center">
            Copyright Javier Marin, 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
