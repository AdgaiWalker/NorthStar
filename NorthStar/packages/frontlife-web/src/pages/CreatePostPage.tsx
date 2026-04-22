import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, ImagePlus, X, BookOpen } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { KNOWLEDGE_BASES } from '@/data/mock';
import type { PostTag } from '@/types';

const TAG_OPTIONS: { tag: PostTag; label: string }[] = [
  { tag: 'share', label: '#分享' },
  { tag: 'help', label: '#求助' },
  { tag: 'secondhand', label: '#二手' },
  { tag: 'event', label: '#活动' },
  { tag: 'discussion', label: '#讨论' },
];

const MAX_LENGTH = 500;

export default function CreatePostPage() {
  const navigate = useNavigate();
  const addPost = useAppStore((s) => s.addPost);
  const userName = useAppStore((s) => s.userName);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<PostTag[]>([]);
  const [selectedKb, setSelectedKb] = useState('freeboard');
  const [publishing, setPublishing] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tag: PostTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 4 - images.length;
    const toProcess = Array.from(files).slice(0, remainingSlots);

    toProcess.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) return; // 5MB limit
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) setImages((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePublish = () => {
    if (!content.trim()) return;
    setPublishing(true);

    const newPost = {
      id: `p-${Date.now()}`,
      authorId: 'zhang',
      time: '刚刚',
      content: content.trim(),
      tags: selectedTags.length > 0 ? selectedTags : (['share'] as PostTag[]),
      saves: 0,
      views: 0,
      replies: [],
      images: images.length > 0 ? images : undefined,
      kbId: selectedKb,
    };

    addPost(newPost);

    setTimeout(() => {
      navigate(`/post/${newPost.id}`);
    }, 300);
  };

  const remaining = MAX_LENGTH - content.length;
  const canPublish = content.trim().length > 0;

  return (
    <div className="mx-auto max-w-[640px] px-4 py-5">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-sage"
        >
          <ArrowLeft size={16} />
          返回
        </button>
        <span className="font-display text-lg font-bold">发帖子</span>
        <div className="w-10" />
      </div>

      {/* Content Input */}
      <div className="rounded-lg border border-border-light bg-surface p-5">
        <textarea
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_LENGTH) {
              setContent(e.target.value);
            }
          }}
          placeholder="分享点什么？快问快答、短分享、求助、二手交易、活动通知"
          className="h-40 w-full resize-none bg-transparent text-base leading-relaxed text-ink outline-none placeholder:text-ink-faint"
          autoFocus
        />
        <div className="mt-2 text-right text-xs text-ink-faint">
          {remaining} / {MAX_LENGTH}
        </div>
      </div>

      {/* Images */}
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border-light">
              <img src={img} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => removeImage(idx)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      {images.length < 4 && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border-light bg-white px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:border-sage hover:text-sage"
        >
          <ImagePlus size={14} />
          添加图片 {images.length > 0 && `(${images.length}/4)`}
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Tags */}
      <div className="mt-4">
        <div className="mb-2 text-sm font-medium text-ink-secondary">选择标签</div>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((opt) => {
            const active = selectedTags.includes(opt.tag);
            return (
              <button
                key={opt.tag}
                onClick={() => toggleTag(opt.tag)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
                  active
                    ? 'border-sage bg-sage-light text-sage'
                    : 'border-border bg-white text-ink-muted hover:border-ink-faint'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Knowledge Base Selector */}
      <div className="mt-4">
        <div className="mb-2 text-sm font-medium text-ink-secondary">发布到</div>
        <div className="relative">
          <select
            value={selectedKb}
            onChange={(e) => setSelectedKb(e.target.value)}
            className="h-10 w-full appearance-none rounded-lg border border-border bg-white pl-9 pr-8 text-sm text-ink outline-none focus:border-sage"
          >
            {Object.values(KNOWLEDGE_BASES).map((kb) => (
              <option key={kb.id} value={kb.id}>
                {kb.name}
              </option>
            ))}
          </select>
          <BookOpen
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
        </div>
      </div>

      {/* Publish Button */}
      <button
        onClick={handlePublish}
        disabled={!canPublish || publishing}
        className={cn(
          'mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all',
          canPublish && !publishing
            ? 'bg-sage hover:bg-sage-dark'
            : 'cursor-not-allowed bg-ink-faint'
        )}
      >
        <Send size={15} />
        {publishing ? '发布中...' : '发布'}
      </button>
    </div>
  );
}
