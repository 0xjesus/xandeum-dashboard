import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, ExternalLink, Code, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/xandeum-logo.png"
                alt="Xandeum"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-semibold bg-gradient-to-r from-xandeum-orange to-xandeum-purple bg-clip-text text-transparent">
                Xandeum Analytics
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time analytics platform for Xandeum pNodes. Monitor, analyze,
              and optimize the storage network.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-xandeum-orange transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/nodes"
                  className="text-muted-foreground hover:text-xandeum-orange transition-colors"
                >
                  All Nodes
                </Link>
              </li>
              <li>
                <Link
                  href="/compare"
                  className="text-muted-foreground hover:text-xandeum-orange transition-colors"
                >
                  Compare Nodes
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://docs.xandeum.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-xandeum-orange transition-colors flex items-center"
                >
                  Documentation
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://xandeum.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-xandeum-orange transition-colors flex items-center"
                >
                  Xandeum Network
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/xandeum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-xandeum-orange transition-colors flex items-center"
                >
                  Discord Community
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a
                href="https://github.com/Xandeum"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-xandeum-orange transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/XandeumNetwork"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-xandeum-orange transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Built for the Xandeum Bounty Program
          </p>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Code className="h-4 w-4" />
              Developed with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> by{' '}
              <a
                href="https://x.com/_0xjesus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xandeum-orange hover:underline font-medium"
              >
                @_0xjesus
              </a>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xandeum-purple hover:underline"
            >
              Solana
            </a>
            {' '}&bull;{' '}
            <a
              href="https://xandeum.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xandeum-orange hover:underline"
            >
              Xandeum
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
