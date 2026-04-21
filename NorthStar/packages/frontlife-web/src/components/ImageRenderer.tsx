import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageRendererProps {
  src?: string;
  alt?: string;
}

export default function ImageRenderer({ src, alt }: ImageRendererProps) {
  const [open, setOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <figure className="group relative my-5 cursor-zoom-in overflow-hidden rounded-lg border border-border-light"
      >
        <img
          src={src}
          alt={alt || ''}
          loading="lazy"
          onClick={() => setOpen(true)}
          className="w-full transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/5"
        >
          <ZoomIn
            size={20}
            className="opacity-0 text-white drop-shadow transition-opacity group-hover:opacity-100"
          />
        </div>
        {alt && (
          <figcaption className="border-t border-border-light bg-bg-subtle px-4 py-2 text-center text-[12px] text-ink-muted"
          >
            {alt}
          </figcaption>
        )}
      </figure>

      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={src}
            alt={alt || ''}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
