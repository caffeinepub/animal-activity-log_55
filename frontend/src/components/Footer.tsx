import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        © 2025. Built with <Heart className="inline h-4 w-4 text-primary fill-primary" />{' '}
        using{' '}
        <a
          href="https://caffeine.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:text-primary transition-colors"
        >
          caffeine.ai
        </a>
      </div>
    </footer>
  );
}
