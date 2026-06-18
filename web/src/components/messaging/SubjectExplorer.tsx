import { Globe } from "lucide-react";

interface SubjectExplorerProps {
  subjects: string[];
}

export default function SubjectExplorer({ subjects }: SubjectExplorerProps) {
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary-500/20 p-3">
            <Globe className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Subjects</h2>
            <p className="mt-2 text-sm leading-6 text-dark-muted">
              A subject is the NATS address used to route messages. Subscribe to
              watch messages on a subject, publish to send a message to it, or
              request/reply to ask a service for a response.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-dark-bg/50 p-4">
                <p className="text-sm font-medium">Subscribe</p>
                <p className="mt-1 text-xs text-dark-muted">
                  Listen for messages matching the subject or wildcard.
                </p>
              </div>
              <div className="rounded-xl bg-dark-bg/50 p-4">
                <p className="text-sm font-medium">Publish</p>
                <p className="mt-1 text-xs text-dark-muted">
                  Send one message to this address.
                </p>
              </div>
              <div className="rounded-xl bg-dark-bg/50 p-4">
                <p className="text-sm font-medium">Request/Reply</p>
                <p className="mt-1 text-xs text-dark-muted">
                  Ask a service for a response and wait for the reply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">Known Subjects</h3>
        {subjects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <span
                key={subject}
                className="rounded-xl border border-dark-border/70 bg-dark-bg/50 px-3 py-2 font-mono text-sm text-primary-300"
              >
                {subject}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-dark-border bg-dark-bg/30 p-8 text-center text-dark-muted">
            <Globe className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>No subjects discovered yet.</p>
            <p className="mt-1 text-sm">
              Subscribe, publish, or send a request to see subjects here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
