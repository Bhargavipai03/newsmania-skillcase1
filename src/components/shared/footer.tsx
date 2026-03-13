
export default function Footer() {
  return (
    <footer className="bg-card border-t-3 border-black mt-12 py-6">
      <div className="container mx-auto px-4 text-center text-foreground">
        <p className="font-semibold">Powered by Multiple News APIs | Neubrutalism Design</p>
        <p className="text-sm mt-2">© {new Date().getFullYear()} NEWSMANIA</p>
      </div>
    </footer>
  );
}
