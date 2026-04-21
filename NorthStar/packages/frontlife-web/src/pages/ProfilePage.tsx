import { useNavigate } from 'react-router-dom';
import { ChevronRight, BookOpen, FileText, Star, Settings, Bell } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getUser, LEVELS } from '@/data/mock';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const navigate = useNavigate();
  const certStatus = useAppStore((s) => s.certStatus);
  const userName = useAppStore((s) => s.userName);
  const userPosts = useAppStore((s) => s.userPosts);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const applyCertification = useAppStore((s) => s.applyCertification);

  const realPostCount = userPosts.length;
  const realBookmarkCount = Object.keys(bookmarks).length;
  const me = {
    name: userName ?? '张同学',
    school: '黑河学院',
    level: certStatus === 'approved' ? 3 : certStatus === 'pending' ? 2 : 1,
    posts: realPostCount,
    collections: realBookmarkCount,
    feedback: 0,
    helped: 0,
    readCount: 0,
    savedCount: 0,
  };
  const u = getUser('zhang');

  return (
    <div className="mx-auto max-w-[640px] px-4 py-5"
    >
      {/* Profile Card */}
      <div className="rounded-lg border border-border-light bg-surface p-7 text-center"
      >
        <div
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
          style={{ background: u.color }}
        >
          {me.name[0]}
        </div>
        <div className="font-display text-[22px] font-bold"
        >{me.name}</div>
        <div className="mt-1 text-[13px] text-ink-muted"
        >{me.school}</div>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-sage-light px-3 py-1 text-[11px] font-semibold text-sage"
        >
          {LEVELS[me.level]}
        </div>

        <div className="mt-5 flex justify-center gap-8 border-t border-border-light pt-5"
        >
          <div className="text-center"
          >
            <div className="font-display text-[22px] font-bold"
            >{me.posts}</div>
            <div className="text-xs text-ink-muted"
            >帖子</div>
          </div>
          <div className="text-center"
          >
            <div className="font-display text-[22px] font-bold"
            >{me.collections}</div>
            <div className="text-xs text-ink-muted"
            >收藏</div>
          </div>
          <div className="text-center"
          >
            <div className="font-display text-[22px] font-bold"
            >{me.feedback}</div>
            <div className="text-xs text-ink-muted"
            >反馈</div>
          </div>
        </div>
      </div>

      {/* Certification Guide */}
      {certStatus === 'none' && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-6 text-center"
        >
          <div className="font-display text-base font-bold"
          >🎓 申请认证作者</div>
          <div className="mx-auto mt-3 max-w-[280px] text-left text-[13px] leading-8 text-ink-secondary"
          >
            <div>✓ 解锁写文章权限</div>
            <div>✓ 获得专属知识库</div>
            <div>✓ 查看影响力数据</div>
          </div>
          <button
            onClick={() => applyCertification()}
            className="mt-4 rounded bg-sage px-7 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-dark"
          >
            立即申请
          </button>
        </div>
      )}

      {/* Pending Review */}
      {certStatus === 'pending' && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-6 text-center"
        >
          <div className="font-display text-base font-bold text-amber-700"
          >⏳ 认证审核中</div>
          <div className="mt-2 text-[13px] text-amber-600"
          >
            你的申请已提交，团队正在审核中。
            <br />
            审核通过后你将获得写文章权限和专属知识库。
          </div>
        </div>
      )}

      {/* Influence Panel (certified only) */}
      {certStatus === 'approved' && (
        <div className="mt-4 rounded-lg border border-border-light bg-surface p-5"
        >
          <div className="mb-4 font-display text-[15px] font-bold"
          >影响力</div>
          <div className="grid grid-cols-3 gap-4"
          >
            <div className="text-center"
            >
              <div className="font-display text-xl font-bold text-sage"
              >{me.helped}</div>
              <div className="text-[11px] text-ink-muted"
              >帮助人数</div>
            </div>
            <div className="text-center"
            >
              <div className="font-display text-xl font-bold text-sage"
              >{me.readCount}</div>
              <div className="text-[11px] text-ink-muted"
              >阅读量</div>
            </div>
            <div className="text-center"
            >
              <div className="font-display text-xl font-bold text-sage"
              >{me.savedCount}</div>
              <div className="text-[11px] text-ink-muted"
              >收藏数</div>
            </div>
          </div>
        </div>
      )}

      {/* My Knowledge Base */}
      {certStatus === 'approved' && (
        <div className="mt-3 overflow-hidden rounded-lg border border-border-light bg-surface"
        >
          <div className="flex items-center justify-between border-b border-border-light px-5 py-3.5 font-display text-[15px] font-bold"
          >
            我的知识库
          </div>
          <button
            onClick={() => navigate('/kb/arrival')}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-bg-subtle"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-light"
            >
              🎒
            </div>
            <div className="flex-1"
            >
              <div className="text-sm font-medium"
              >新生报到全攻略</div>
              <div className="text-xs text-ink-muted"
              >3 篇文章 · 156 收藏</div>
            </div>
            <ChevronRight size={16} className="text-ink-faint" />
          </button>
        </div>
      )}

      {/* Menu Sections */}
      <div className="mt-3 overflow-hidden rounded-lg border border-border-light bg-surface"
      >
        <div className="flex items-center justify-between border-b border-border-light px-5 py-3.5 font-display text-[15px] font-bold"
        >
          我的内容
        </div>
        <MenuItem icon={<FileText size={18} />}
          iconBg="bg-bg-subtle" title="我的帖子" sub={`${realPostCount} 条`} />
        <MenuItem icon={<Star size={18} />}
          iconBg="bg-bg-subtle" title="我的收藏" sub={`${realBookmarkCount} 个`} />
        <MenuItem icon={<BookOpen size={18} />}
          iconBg="bg-bg-subtle" title="我的反馈" sub="0 条" />
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-border-light bg-surface"
      >
        <div className="flex items-center justify-between border-b border-border-light px-5 py-3.5 font-display text-[15px] font-bold"
        >
          设置
        </div>
        <MenuItem icon={<Settings size={18} />}
          iconBg="bg-bg-subtle" title="账号设置" />
        <MenuItem icon={<Bell size={18} />}
          iconBg="bg-bg-subtle" title="通知设置" />
      </div>

      {/* Logout */}
      <div className="mt-6 text-center"
      >
        <button
          onClick={() => navigate('/')}
          className="text-[13px] text-ink-faint transition-colors hover:text-ink-muted"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  iconBg,
  title,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub?: string;
}) {
  return (
    <button className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-bg-subtle last:rounded-b-[14px]"
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-secondary',
          iconBg
        )}
      >
        {icon}
      </div>
      <div className="flex-1"
      >
        <div className="text-sm font-medium"
        >{title}</div>
        {sub && <div className="text-xs text-ink-muted"
        >{sub}</div>}
      </div>
      <ChevronRight size={16} className="text-ink-faint" />
    </button>
  );
}
