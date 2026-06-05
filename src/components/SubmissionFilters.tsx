import { useSubmissionStore } from '../store/useSubmissionStore'
import { useI18nStore } from '../store/useI18nStore'

const labels = {
  uz: {
    status: "Holat",
    all: "Barchasi",
    pending: "Kutilmoqda",
    graded: "Baholangan",
    group: "Guruh",
    groupPlaceholder: "Guruh nomi...",
    topicId: "Mavzu ID",
    topicPlaceholder: "Content item ID...",
  },
  ru: {
    status: "Статус",
    all: "Все",
    pending: "Ожидают",
    graded: "Оценено",
    group: "Группа",
    groupPlaceholder: "Название группы...",
    topicId: "ID темы",
    topicPlaceholder: "Content item ID...",
  },
  en: {
    status: "Status",
    all: "All",
    pending: "Pending",
    graded: "Graded",
    group: "Group",
    groupPlaceholder: "Group name...",
    topicId: "Topic ID",
    topicPlaceholder: "Content item ID...",
  },
}

export function SubmissionFilters() {
  const { filters, setFilters, fetchAllSubmissions } = useSubmissionStore()
  const { language } = useI18nStore()
  const L = labels[language]

  return (
    <div className="glass-panel p-4 border-white/5">
      <div className="flex flex-wrap items-center gap-4">
        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-white/40 text-xs font-bold uppercase tracking-wider">{L.status}</label>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ status: e.target.value as 'all' | 'pending' | 'graded' })
              fetchAllSubmissions()
            }}
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-white text-sm focus:outline-none focus:border-purple-500/30"
          >
            <option value="all">{L.all}</option>
            <option value="pending">{L.pending}</option>
            <option value="graded">{L.graded}</option>
          </select>
        </div>

        {/* Group filter */}
        <div className="flex flex-col gap-1">
          <label className="text-white/40 text-xs font-bold uppercase tracking-wider">{L.group}</label>
          <input
            type="text"
            value={filters.group}
            onChange={(e) => {
              setFilters({ group: e.target.value })
              fetchAllSubmissions()
            }}
            placeholder={L.groupPlaceholder}
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-white text-sm focus:outline-none focus:border-purple-500/30 placeholder:text-white/20"
          />
        </div>

        {/* Content item filter */}
        <div className="flex flex-col gap-1">
          <label className="text-white/40 text-xs font-bold uppercase tracking-wider">{L.topicId}</label>
          <input
            type="text"
            value={filters.contentItemId}
            onChange={(e) => {
              setFilters({ contentItemId: e.target.value })
              fetchAllSubmissions()
            }}
            placeholder={L.topicPlaceholder}
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-white text-sm focus:outline-none focus:border-purple-500/30 placeholder:text-white/20"
          />
        </div>
      </div>
    </div>
  )
}
