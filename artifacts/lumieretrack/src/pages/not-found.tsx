import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background px-5">
      <div className="w-full max-w-md border-t-2 border-foreground pt-6">
        <div className="eyebrow">Error 404</div>
        <h1 className="mt-3 text-4xl">There is no record at this address.</h1>
        <p className="mt-3 text-sm text-muted-foreground">The link may be outdated, or the page may belong to a course you are not part of.</p>
        <Link href="/" className="mt-6 inline-flex rounded-[3px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-foreground">Return home</Link>
      </div>
    </div>
  );
}
