import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ClipboardList, Edit, FileText, GraduationCap, Plus, Save, Search, ShieldCheck, Trash2, UserCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore, type Profile, type UserRole } from '../store/useAuthStore'
import { useRoleRequestStore } from '../store/useRoleRequestStore'
import type { ContentItem, ContentType } from '../store/useContentStore'

type AdminTab = 'users' | 'test' | 'material' | 'practice'

interface ContentForm {
  editingId: string | null
  title: string
  description: string
  body: string
  topicId: string
  questionsText: string
  practiceText: string
  status: 'draft' | 'published'
}

const emptyForm: ContentForm = {
  editingId: null,
  title: '',
  description: '',
  body: '',
  topicId: '',
  questionsText: '',
  practiceText: '',
  status: 'published',
}

function tabToType(tab: AdminTab): ContentType | null {
  if (tab === 'test') return 'test'
  if (tab === 'material') return 'material'
  if (tab === 'practice') return 'practice'
  return null
}

function contentTypeLabel(type: ContentType) {
  if (type === 'test') return 'Test'
  if (type === 'practice') return 'Amaliyot'
  return "Ma'lumot"
}

function parseQuestions(raw: string) {
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean)
  return lines.map((line, index) => {
    const parts = line.split('|').map((part) => part.trim())
    if (parts.length < 6) {
      throw new Error(`${index + 1}-savol formati noto'g'ri`)
    }

    const [question, a, b, c, d, answerText] = parts
    const answer = Number(answerText)
    if (!Number.isInteger(answer) || answer < 1 || answer > 4) {
      throw new Error(`${index + 1}-savolda javob raqami 1-4 oralig'ida bo'lishi kerak`)
    }

    const options = [a, b, c, d]
    return {
      q: { uz: question, ru: question, en: question },
      options: { uz: options, ru: options, en: options },
      answer: answer - 1,
    }
  })
}

function serializeQuestions(item: ContentItem) {
  return (item.questions || [])
    .map((question) => {
      const options = question.options?.uz || []
      return [question.q?.uz || '', options[0] || '', options[1] || '', options[2] || '', options[3] || '', (question.answer ?? 0) + 1].join(' | ')
    })
    .join('\n')
}

function parsePractice(raw: string, description: string) {
  const phases = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split('|').map((part) => part.trim())
      if (parts.length < 3) {
        throw new Error(`${index + 1}-bosqich formati noto'g'ri`)
      }

      const [title, minutesText, phaseDescription, toolsText = ''] = parts
      const durationMinutes = Number(minutesText)
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error(`${index + 1}-bosqichda vaqt musbat raqam bo'lishi kerak`)
      }

      return {
        title,
        duration: `${durationMinutes} daqiqa`,
        durationMinutes,
        description: phaseDescription,
        tools: toolsText.split(',').map((tool) => tool.trim()).filter(Boolean),
      }
    })

  return {
    objective: description,
    groupTask: description,
    phases,
  }
}

function serializePractice(item: ContentItem) {
  return (item.practice?.phases || [])
    .map((phase) => [phase.title, phase.durationMinutes, phase.description, (phase.tools || []).join(', ')].join(' | '))
    .join('\n')
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState<ContentForm>(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const { profile, user } = useAuthStore()
  const { allRequests, fetchAllRequests } = useRoleRequestStore()
  const navigate = useNavigate()
  const activeContentType = tabToType(activeTab)

  const pendingRequestCount = useMemo(
    () => allRequests.filter((r) => r.status === 'pending').length,
    [allRequests]
  )

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeContentType) {
      fetchContent(activeContentType)
    }
  }, [activeTab, activeContentType])

  useEffect(() => {
    fetchAllRequests()
  }, [])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return users.filter((item) =>
      item.full_name?.toLowerCase().includes(query) ||
      item.username?.toLowerCase().includes(query) ||
      item.group_name?.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!fetchError) setUsers((data || []) as Profile[])
    setLoading(false)
  }

  const fetchContent = async (type: ContentType) => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('content_items')
      .select('*')
      .eq('content_type', type)
      .order('updated_at', { ascending: false })

    if (!fetchError) setContentItems((data || []) as ContentItem[])
    setLoading(false)
  }

  const updateRole = async (userId: string, newRole: Exclude<UserRole, 'admin'>) => {
    setError('')
    setMessage('')
    const { error: rpcError } = await supabase.rpc('set_user_role', {
      p_user_id: userId,
      p_role: newRole,
    })

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    setMessage('Rol yangilandi')
    fetchUsers()
  }

  const resetForm = () => {
    setForm(emptyForm)
    setError('')
    setMessage('')
  }

  const editContent = (item: ContentItem) => {
    setActiveTab(item.content_type)
    setForm({
      editingId: item.id,
      title: item.title,
      description: item.description || '',
      body: item.body || '',
      topicId: item.topic_id ? String(item.topic_id) : '',
      questionsText: serializeQuestions(item),
      practiceText: serializePractice(item),
      status: item.status,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveContent = async () => {
    if (!activeContentType) return

    setError('')
    setMessage('')

    if (!form.title.trim()) {
      setError('Sarlavha kiriting')
      return
    }

    try {
      const payload = {
        content_type: activeContentType,
        title: form.title.trim(),
        description: form.description.trim(),
        body: activeContentType === 'material' ? form.body.trim() : '',
        topic_id: form.topicId ? Number(form.topicId) : null,
        questions: activeContentType === 'test' ? parseQuestions(form.questionsText) : [],
        practice: activeContentType === 'practice' ? parsePractice(form.practiceText, form.description.trim()) : {},
        status: form.status,
        created_by: user?.id || null,
        updated_at: new Date().toISOString(),
      }

      const request = form.editingId
        ? supabase.from('content_items').update(payload).eq('id', form.editingId)
        : supabase.from('content_items').insert(payload)

      const { error: saveError } = await request
      if (saveError) throw saveError

      setMessage(form.editingId ? 'Kontent yangilandi' : 'Kontent qo\'shildi')
      setForm(emptyForm)
      fetchContent(activeContentType)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Saqlashda xatolik yuz berdi')
    }
  }

  const deleteContent = async (item: ContentItem) => {
    if (!window.confirm(`${item.title} o'chirilsinmi?`)) return

    const { error: deleteError } = await supabase
      .from('content_items')
      .delete()
      .eq('id', item.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setMessage('Kontent o\'chirildi')
    fetchContent(item.content_type)
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white p-6">
        <ShieldCheck size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Ruxsat yo'q</h1>
        <p className="text-white/60">Bu sahifa faqat admin uchun.</p>
      </div>
    )
  }

  const tabs: Array<{ id: AdminTab; label: string; icon: typeof Users }> = [
    { id: 'users', label: 'Foydalanuvchilar', icon: Users },
    { id: 'test', label: "Test qo'shish", icon: ClipboardList },
    { id: 'material', label: "Ma'lumot", icon: FileText },
    { id: 'practice', label: "Amaliyot", icon: GraduationCap },
  ]

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2 text-cyan-400">
            <ShieldCheck size={18} />
            <span className="text-xs font-black uppercase tracking-[0.25em]">Admin control</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Panel</h1>
          <p className="text-white/50 mt-1">Rollar, testlar, materiallar va amaliyotlarni boshqarish.</p>
        </div>

        <div className="grid grid-cols-2 md:flex p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                resetForm()
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <tab.icon size={17} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Role Requests Card */}
      <div
        onClick={() => navigate('/admin/role-requests')}
        className="glass-panel p-5 border-white/5 flex items-center justify-between cursor-pointer hover:border-cyan-500/20 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/15 flex items-center justify-center">
            <UserCheck size={22} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold group-hover:text-cyan-300 transition-colors">Rol so'rovlari</h3>
            <p className="text-white/40 text-sm">O'qituvchi rolini so'ragan foydalanuvchilar</p>
          </div>
        </div>
        {pendingRequestCount > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-400/20 text-orange-300 text-sm font-bold">
            {pendingRequestCount} kutilmoqda
          </span>
        )}
      </div>

      {(message || error) && (
        <div className={`rounded-2xl border p-4 text-sm ${error ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-green-500/10 border-green-500/20 text-green-300'}`}>
          {error || message}
        </div>
      )}

      {activeTab === 'users' ? (
        <div className="glass-panel overflow-hidden border-white/5">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Foydalanuvchilar</h2>
              <p className="text-white/40 text-sm mt-1">Ro'yxatdan o'tganlar avval talaba bo'ladi, admin ularga teacher rolini beradi.</p>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ism, login yoki guruh..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/30"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] text-white/40 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Foydalanuvchi</th>
                  <th className="px-6 py-4">Guruh</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Ro'yxatdan o'tgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-white/30">Yuklanmoqda...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-white/30">Foydalanuvchilar topilmadi</td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/15 flex items-center justify-center text-lg">
                            {item.avatar_emoji || '🎯'}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">{item.full_name || 'Nomsiz foydalanuvchi'}</div>
                            <div className="text-white/35 text-xs">@{item.username || 'login yoq'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium">
                          {item.group_name || 'Guruhsiz'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.role === 'admin' ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-bold">
                            <ShieldCheck size={14} /> Admin
                          </span>
                        ) : (
                          <select
                            value={item.role}
                            onChange={(e) => updateRole(item.id, e.target.value as Exclude<UserRole, 'admin'>)}
                            className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50"
                          >
                            <option value="student">Talaba</option>
                            <option value="teacher">Teacher</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white/35 text-xs">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeContentType ? (
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <div className="glass-panel p-6 border-white/5 h-fit">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">{contentTypeLabel(activeContentType)} boshqaruvi</h2>
                <p className="text-white/40 text-xs mt-1">{form.editingId ? 'Tahrirlash rejimi' : 'Yangi kontent'}</p>
              </div>
              <button onClick={resetForm} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5">
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={form.title}
                onChange={(e) => setForm((state) => ({ ...state, title: e.target.value }))}
                placeholder="Sarlavha"
                className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/35"
              />
              <input
                value={form.topicId}
                onChange={(e) => setForm((state) => ({ ...state, topicId: e.target.value.replace(/\D/g, '') }))}
                placeholder="Mavzu ID (ixtiyoriy)"
                className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/35"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm((state) => ({ ...state, description: e.target.value }))}
                placeholder="Qisqa tavsif"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/35 resize-none"
              />

              {activeContentType === 'material' && (
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((state) => ({ ...state, body: e.target.value }))}
                  placeholder="O'quv materiali matni"
                  rows={9}
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/35 resize-none"
                />
              )}

              {activeContentType === 'test' && (
                <textarea
                  value={form.questionsText}
                  onChange={(e) => setForm((state) => ({ ...state, questionsText: e.target.value }))}
                  placeholder={"Har qatorda: Savol | A | B | C | D | to'g'ri javob raqami (1-4)"}
                  rows={9}
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/35 resize-none"
                />
              )}

              {activeContentType === 'practice' && (
                <textarea
                  value={form.practiceText}
                  onChange={(e) => setForm((state) => ({ ...state, practiceText: e.target.value }))}
                  placeholder={"Har qatorda: Bosqich nomi | daqiqa | topshiriq | vositalar, vergul bilan"}
                  rows={9}
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/35 resize-none"
                />
              )}

              <select
                value={form.status}
                onChange={(e) => setForm((state) => ({ ...state, status: e.target.value as ContentForm['status'] }))}
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/5 text-white text-sm focus:outline-none focus:border-cyan-500/35"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              <button onClick={saveContent} className="btn-primary w-full flex items-center justify-center gap-2">
                <Save size={16} /> {form.editingId ? 'Saqlash' : "Qo'shish"}
              </button>
            </div>
          </div>

          <div className="glass-panel overflow-hidden border-white/5">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Kontentlar</h2>
              <p className="text-white/40 text-sm mt-1">Published kontentlar talabalar panelida ko'rinadi.</p>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-10 text-center text-white/30">Yuklanmoqda...</div>
              ) : contentItems.length === 0 ? (
                <div className="p-10 text-center text-white/30">Hozircha kontent yo'q</div>
              ) : (
                contentItems.map((item) => (
                  <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={16} className="text-cyan-400" />
                        <h3 className="text-white font-bold truncate">{item.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'published' ? 'bg-green-500/10 text-green-300' : 'bg-yellow-500/10 text-yellow-300'}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-white/45 text-sm line-clamp-2">{item.description || item.body}</p>
                      <p className="text-white/25 text-xs mt-2">{new Date(item.updated_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => editContent(item)} className="p-2 rounded-xl text-white/45 hover:text-cyan-300 hover:bg-cyan-500/10">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => deleteContent(item)} className="p-2 rounded-xl text-white/45 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
