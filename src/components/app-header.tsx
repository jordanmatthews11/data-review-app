import Image from 'next/image';
import { ThemeToggle } from './theme-toggle';

export function AppHeader() {
  return (
    <header className="border-b border-border/50 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Image
                src="https://fieldagent-app.s3.amazonaws.com/project_files/2025-09/1586029/storesight_primary-1.png"
                alt="StoreSight Logo"
                width={150}
                height={40}
                className="object-contain dark:invert"
            />
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 text-sm font-medium">
              <a href="https://studio--surveywizard30.us-central1.hosted.app/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                Survey Wizard
              </a>
              <a href="https://studio--storesight-replyai.us-central1.hosted.app/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                CustomerReplyAI
              </a>
              <a href="https://studio--store-list-builder2.us-central1.hosted.app/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                Store List Builder
              </a>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
