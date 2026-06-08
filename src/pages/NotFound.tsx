import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas p-3 md:p-4 flex items-center justify-center">
      <div className="nori-frame max-w-lg w-full p-10 text-center">
        <p className="nori-jp-display text-5xl mb-4">迷子</p>
        <div className="nori-wavy-line mx-auto mb-6" />
        <h1 className="text-4xl font-bold uppercase tracking-wide text-foreground mb-2">404</h1>
        <p className="mb-6 text-muted-foreground normal-case tracking-normal font-normal">
          Halaman tidak ditemukan
        </p>
        <Button asChild>
          <Link to="/">Kembali ke Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
