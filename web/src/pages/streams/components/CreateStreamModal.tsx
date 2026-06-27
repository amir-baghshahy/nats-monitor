import { useState } from "react";
import { X } from "lucide-react";
import type { CreateStreamRequest } from "../../../types";

interface CreateStreamModalProps {
  onClose: () => void;
  onSubmit: (data: CreateStreamRequest) => void;
  isPending: boolean;
}

export default function CreateStreamModal({
  onClose,
  onSubmit,
  isPending,
}: CreateStreamModalProps) {
  const [name, setName] = useState("");
  const [subjects, setSubjects] = useState("");
  const [storage, setStorage] = useState<"file" | "memory">("file");
  const [replicas, setReplicas] = useState(1);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      name,
      subjects: subjects
        .split(",")
        .map((subject) => subject.trim())
        .filter(Boolean),
      storage: storage as CreateStreamRequest["storage"],
      replicas,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Create Stream</h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-bg rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Stream Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="my-stream"
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subjects</label>
            <input
              type="text"
              value={subjects}
              onChange={(event) => setSubjects(event.target.value)}
              placeholder="orders.*, events.*"
              className="input w-full"
              required
            />
            <p className="text-xs text-dark-muted mt-1">Comma-separated list</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Storage</label>
            <select
              value={storage}
              onChange={(event) =>
                setStorage(event.target.value as "file" | "memory")
              }
              className="input w-full"
            >
              <option value="file">File</option>
              <option value="memory">Memory</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Replicas</label>
            <input
              type="number"
              value={replicas}
              onChange={(event) => setReplicas(Number(event.target.value))}
              min={1}
              max={5}
              className="input w-full"
            />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Creating..." : "Create Stream"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
