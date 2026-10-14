import type { Profile, UserRole, LeaderboardEntry } from '../store/useAuthStore'
import type { ContentItem, ContentType } from '../store/useContentStore'
import type { SubmissionWithProfile } from '../types/submission'
import type { RoleRequest, RoleRequestWithProfile } from '../types/roleRequest'

export const SPREADSHEET_ID = '1aJGuP1Dkj_hJYb76d4zwimz20zUcjcOK0oUOY2SEqPM'
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`

const LOCAL_STORAGE_KEY_API_URL = 'digitaledu_sheets_api_url'
const LOCAL_STORAGE_KEY_SESSION = 'digitaledu_auth_session'
const LOCAL_STORAGE_KEY_MOCK_DB = 'digitaledu_sheets_mock_db'

export function getGoogleSheetsApiUrl(): string {
  const customUrl = localStorage.getItem(LOCAL_STORAGE_KEY_API_URL)
  if (customUrl && customUrl.trim()) return customUrl.trim()
  return (import.meta.env.VITE_GOOGLE_SHEETS_API_URL || '').trim()
}

export function setGoogleSheetsApiUrl(url: string): void {
  if (url && url.trim()) {
    localStorage.setItem(LOCAL_STORAGE_KEY_API_URL, url.trim())
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY_API_URL)
  }
}

export function isGoogleSheetsConnected(): boolean {
  return Boolean(getGoogleSheetsApiUrl())
}

// ─── LOCAL STORAGE FALLBACK DB (Used if Apps Script URL is not set yet) ───
interface MockDb {
  profiles: Profile[]
  content_items: ContentItem[]
  quiz_results: any[]
  practice_results: any[]
  diagnostic_results: any[]
  submissions: any[]
  role_requests: any[]
}

function getMockDb(): MockDb {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_MOCK_DB)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading mock db:', e)
  }

  // Initial Seed
  const initialDb: MockDb = {
    profiles: [
      {
        id: 'admin-default-id',
        username: 'admin',
        full_name: 'Bosh Administrator',
        avatar_emoji: '👑',
        group_name: 'DigitalEdu Boshqaruvi',
        role: 'admin',
        diagnostic_completed: true,
        diagnostic_score: 15,
        diagnostic_total: 15,
        diagnostic_completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'teacher-default-id',
        username: 'teacher',
        full_name: 'Farhod Alimov',
        avatar_emoji: '👨‍🏫',
        group_name: 'Pedagogika kafedrasi',
        role: 'teacher',
        diagnostic_completed: true,
        diagnostic_score: 14,
        diagnostic_total: 15,
        diagnostic_completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'student-default-id',
        username: 'student',
        full_name: 'Malika Karimova',
        avatar_emoji: '🎓',
        group_name: '201-guruh',
        role: 'student',
        diagnostic_completed: true,
        diagnostic_score: 12,
        diagnostic_total: 15,
        diagnostic_completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    content_items: [],
    quiz_results: [],
    practice_results: [],
    diagnostic_results: [],
    submissions: [],
    role_requests: [],
  }
  saveMockDb(initialDb)
  return initialDb
}

function saveMockDb(db: MockDb) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_MOCK_DB, JSON.stringify(db))
  } catch (e) {
    console.error('Error saving mock db:', e)
  }
}

// ─── API DISPATCHER ───
async function apiRequest<T>(action: string, payload: Record<string, any> = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  const apiUrl = getGoogleSheetsApiUrl()

  if (apiUrl) {
    try {
      // POST with text/plain body avoids CORS preflight OPTIONS in Apps Script
      // Also pass ?action= in the URL so it works seamlessly on GET/POST redirects
      const sep = apiUrl.includes('?') ? '&' : '?'
      const requestUrl = `${apiUrl}${sep}action=${encodeURIComponent(action)}`
      const res = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload }),
        redirect: 'follow',
      })

      const json = await res.json()
      if (json.success) {
        return { success: true, data: json as T }
      }
      return { success: false, error: json.error || 'Noma\'lum xatolik yuz berdi' }
    } catch (err) {
      console.warn(`[Google Sheets API] '${action}' so'rovi amalga oshmadi, fallback ishlatiladi:`, err)
    }
  }

  // Fallback to Local DB when Apps Script is not deployed or network failed
  return localDbExecute<T>(action, payload)
}

function localDbExecute<T>(action: string, data: Record<string, any>): { success: boolean; data?: T; error?: string } {
  const db = getMockDb()

  switch (action) {
    case 'ping':
      return {
        success: true,
        data: {
          success: true,
          message: 'Lokal rejimda ishlamoqda (Google Sheets ulanmagan)',
          spreadsheetId: SPREADSHEET_ID,
        } as T,
      }

    case 'init':
      return { success: true, data: { success: true, message: 'Lokal baza yangilandi' } as T }

    case 'signUp': {
      const email = (data.email || '').toLowerCase().trim()
      const existing = db.profiles.find((p) => (p as any).email === email)
      if (existing) return { success: false, error: 'Ushbu email allaqachon ro\'yxatdan o\'tgan' }

      const id = 'usr_' + Date.now() + Math.random().toString(36).substring(2, 7)
      const username = email.split('@')[0].replace(/[^a-z0-9_]/g, '_')
      const profile: Profile = {
        id,
        username,
        full_name: data.fullName || data.full_name || username,
        avatar_emoji: '🎯',
        group_name: data.groupName || data.group_name || '',
        role: data.role || 'student',
        diagnostic_completed: false,
        diagnostic_score: 0,
        diagnostic_total: 0,
        diagnostic_completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      ;(profile as any).email = email
      ;(profile as any).password = data.password

      db.profiles.push(profile)
      saveMockDb(db)
      return { success: true, data: { success: true, user: { id, email }, profile } as T }
    }

    case 'signIn': {
      const email = (data.email || '').toLowerCase().trim()
      const pwd = data.password || ''
      const profile = db.profiles.find((p) => {
        const pEmail = (p as any).email || `${p.username}@digitaledu.uz`
        return pEmail === email || p.username === email
      })

      if (!profile) return { success: false, error: 'Foydalanuvchi topilmadi' }
      if ((profile as any).password && (profile as any).password !== pwd) {
        return { success: false, error: 'Parol noto\'g\'ri kiritildi' }
      }

      return {
        success: true,
        data: {
          success: true,
          user: { id: profile.id, email: (profile as any).email || `${profile.username}@digitaledu.uz` },
          profile,
        } as T,
      }
    }

    case 'getProfile': {
      const profile = db.profiles.find((p) => p.id === data.userId)
      if (!profile) return { success: false, error: 'Profil topilmadi' }
      return { success: true, data: { success: true, profile } as T }
    }

    case 'updateProfile': {
      const pIdx = db.profiles.findIndex((p) => p.id === data.userId)
      if (pIdx === -1) return { success: false, error: 'Profil topilmadi' }
      db.profiles[pIdx] = { ...db.profiles[pIdx], ...data, updated_at: new Date().toISOString() }
      saveMockDb(db)
      return { success: true, data: { success: true } as T }
    }

    case 'completeDiagnostic': {
      const pIdx = db.profiles.findIndex((p) => p.id === data.userId)
      if (pIdx !== -1) {
        db.profiles[pIdx].diagnostic_completed = true
        db.profiles[pIdx].diagnostic_score = data.score
        db.profiles[pIdx].diagnostic_total = data.total
        db.profiles[pIdx].diagnostic_completed_at = new Date().toISOString()
        db.profiles[pIdx].updated_at = new Date().toISOString()
      }
      db.diagnostic_results.push({
        id: 'diag_' + Date.now(),
        user_id: data.userId,
        score: data.score,
        total: data.total,
        answers: data.answers,
        completed_at: new Date().toISOString(),
      })
      saveMockDb(db)
      return { success: true, data: { success: true } as T }
    }

    case 'saveQuizResult': {
      const score = Number(data.score || 0)
      const total = Number(data.totalQuestions || 0)
      const res = {
        id: 'qz_' + Date.now(),
        user_id: data.userId,
        topic_id: Number(data.topicId || 0),
        content_item_id: data.contentItemId || null,
        part_id: Number(data.partId || 1),
        score,
        total_questions: total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0,
        xp_earned: score * 10,
        completed_at: new Date().toISOString(),
      }
      db.quiz_results.push(res)
      saveMockDb(db)
      return { success: true, data: { success: true, ...res } as T }
    }

    case 'savePracticeResult': {
      const score = Number(data.score || 0)
      const maxScore = Number(data.maxScore || 100)
      const res = {
        id: 'pr_' + Date.now(),
        user_id: data.userId,
        topic_id: Number(data.topicId || 0),
        content_item_id: data.contentItemId || null,
        score,
        max_score: maxScore,
        xp_earned: maxScore > 0 ? Math.round((score / maxScore) * 50) : 0,
        completed_at: new Date().toISOString(),
      }
      db.practice_results.push(res)
      saveMockDb(db)
      return { success: true, data: { success: true, ...res } as T }
    }

    case 'getLeaderboard': {
      const userMap: Record<string, LeaderboardEntry> = {}
      for (const p of db.profiles) {
        userMap[p.id] = {
          user_id: p.id,
          full_name: p.full_name || p.username || 'Foydalanuvchi',
          avatar_emoji: p.avatar_emoji || '🎯',
          group_name: p.group_name || '',
          diagnostic_score: p.diagnostic_score || 0,
          total_quiz_xp: 0,
          total_quizzes: 0,
          avg_quiz_percentage: 0,
          total_practice_xp: 0,
          total_practices: 0,
          total_xp: (p.diagnostic_score || 0) * 5,
          topics_completed: 0,
          level: 1,
        }
      }

      for (const q of db.quiz_results) {
        if (userMap[q.user_id]) {
          userMap[q.user_id].total_quiz_xp += q.xp_earned || 0
          userMap[q.user_id].total_quizzes += 1
          userMap[q.user_id].total_xp += q.xp_earned || 0
        }
      }

      for (const pr of db.practice_results) {
        if (userMap[pr.user_id]) {
          userMap[pr.user_id].total_practice_xp += pr.xp_earned || 0
          userMap[pr.user_id].total_practices += 1
          userMap[pr.user_id].total_xp += pr.xp_earned || 0
        }
      }

      const leaderboard = Object.values(userMap).map((u) => ({
        ...u,
        level: Math.floor(u.total_xp / 100) + 1,
      })).sort((a, b) => b.total_xp - a.total_xp)

      return { success: true, data: { success: true, leaderboard } as T }
    }

    case 'getContentItems': {
      let items = [...db.content_items]
      if (data.type) items = items.filter((it) => it.content_type === data.type)
      if (data.status) items = items.filter((it) => it.status === data.status)
      return { success: true, data: { success: true, items } as T }
    }

    case 'getContentItem': {
      const item = db.content_items.find((it) => it.id === data.id)
      return { success: true, data: { success: true, item: item || null } as T }
    }

    case 'saveContentItem': {
      if (data.id) {
        const idx = db.content_items.findIndex((it) => it.id === data.id)
        if (idx !== -1) {
          db.content_items[idx] = { ...db.content_items[idx], ...data, updated_at: new Date().toISOString() }
          saveMockDb(db)
          return { success: true, data: { success: true, id: data.id } as T }
        }
      }
      const newId = 'cnt_' + Date.now()
      const newItem: ContentItem = {
        id: newId,
        content_type: data.content_type || 'material',
        title: data.title || '',
        description: data.description || '',
        body: data.body || '',
        topic_id: data.topic_id || null,
        questions: data.questions || [],
        practice: data.practice || {},
        status: data.status || 'published',
        created_by: data.created_by || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      db.content_items.unshift(newItem)
      saveMockDb(db)
      return { success: true, data: { success: true, id: newId } as T }
    }

    case 'deleteContentItem': {
      db.content_items = db.content_items.filter((it) => it.id !== data.id)
      saveMockDb(db)
      return { success: true, data: { success: true } as T }
    }

    case 'uploadSubmission': {
      const idx = db.submissions.findIndex((s) => s.user_id === data.userId && s.content_item_id === data.contentItemId)
      if (idx !== -1) {
        db.submissions[idx].file_name = data.fileName
        db.submissions[idx].file_size = data.fileSize
        db.submissions[idx].file_data = data.fileData
        db.submissions[idx].status = 'pending'
        db.submissions[idx].score = null
        db.submissions[idx].feedback = null
        db.submissions[idx].updated_at = new Date().toISOString()
      } else {
        db.submissions.unshift({
          id: 'sub_' + Date.now(),
          user_id: data.userId,
          content_item_id: data.contentItemId,
          file_name: data.fileName,
          file_size: data.fileSize,
          file_data: data.fileData,
          status: 'pending',
          score: null,
          feedback: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
      saveMockDb(db)
      return { success: true, data: { success: true } as T }
    }

    case 'getSubmissions': {
      const profMap = Object.fromEntries(db.profiles.map((p) => [p.id, p]))
      const contMap = Object.fromEntries(db.content_items.map((c) => [c.id, c]))
      let list = db.submissions.map((s) => ({
        ...s,
        profiles: profMap[s.user_id] || { full_name: 'Talaba', group_name: '', avatar_emoji: '🎯' },
        content_items: contMap[s.content_item_id] || { title: 'Mavzu', topic_id: 1 },
      }))
      if (data.status && data.status !== 'all') list = list.filter((s) => s.status === data.status)
      if (data.contentItemId) list = list.filter((s) => s.content_item_id === data.contentItemId)
      return { success: true, data: { success: true, submissions: list } as T }
    }

    case 'getMySubmissions': {
      const contMap = Object.fromEntries(db.content_items.map((c) => [c.id, c]))
      const list = db.submissions
        .filter((s) => s.user_id === data.userId)
        .map((s) => ({
          ...s,
          content_items: contMap[s.content_item_id] || { title: 'Mavzu', topic_id: 1 },
        }))
      return { success: true, data: { success: true, submissions: list } as T }
    }

    case 'gradeSubmission': {
      const sub = db.submissions.find((s) => s.id === data.submissionId)
      if (sub) {
        sub.status = 'graded'
        sub.score = Number(data.score)
        sub.feedback = data.feedback || ''
        sub.graded_by = data.gradedBy || ''
        sub.graded_at = new Date().toISOString()
        saveMockDb(db)
        return { success: true, data: { success: true } as T }
      }
      return { success: false, error: 'Topshiriq topilmadi' }
    }

    case 'downloadFile': {
      const sub = db.submissions.find((s) => s.id === data.submissionId)
      if (sub) {
        return {
          success: true,
          data: {
            success: true,
            fileName: sub.file_name,
            fileData: sub.file_data,
            fileSize: sub.file_size,
          } as T,
        }
      }
      return { success: false, error: 'Fayl topilmadi' }
    }

    case 'submitRoleRequest': {
      const existing = db.role_requests.find((r) => r.user_id === data.userId && r.status === 'pending')
      if (existing) return { success: false, error: 'Siz allaqachon so\'rov yuborgansiz' }
      const newReq = {
        id: 'req_' + Date.now(),
        user_id: data.userId,
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      db.role_requests.unshift(newReq)
      saveMockDb(db)
      return { success: true, data: { success: true, id: newReq.id } as T }
    }

    case 'getRoleRequests': {
      const profMap = Object.fromEntries(db.profiles.map((p) => [p.id, p]))
      const requests = db.role_requests.map((r) => ({
        ...r,
        profiles: profMap[r.user_id] || { id: r.user_id, full_name: 'Noma\'lum', role: 'student' },
      }))
      return { success: true, data: { success: true, requests } as T }
    }

    case 'getMyRoleRequest': {
      const my = db.role_requests.find((r) => r.user_id === data.userId)
      return { success: true, data: { success: true, request: my || null } as T }
    }

    case 'reviewRoleRequest': {
      const req = db.role_requests.find((r) => r.id === data.requestId)
      if (req) {
        req.status = data.approved ? 'approved' : 'rejected'
        req.reviewed_by = data.reviewerId || null
        req.reviewed_at = new Date().toISOString()
        req.updated_at = new Date().toISOString()

        if (data.approved) {
          const prof = db.profiles.find((p) => p.id === req.user_id)
          if (prof) prof.role = 'teacher'
        }
        saveMockDb(db)
        return { success: true, data: { success: true } as T }
      }
      return { success: false, error: 'So\'rov topilmadi' }
    }

    case 'getUsers': {
      return { success: true, data: { success: true, users: db.profiles } as T }
    }

    case 'setUserRole': {
      const user = db.profiles.find((p) => p.id === data.userId)
      if (user) {
        user.role = data.role
        user.updated_at = new Date().toISOString()
        saveMockDb(db)
        return { success: true, data: { success: true } as T }
      }
      return { success: false, error: 'Foydalanuvchi topilmadi' }
    }

    case 'getTeacherData': {
      const students = db.profiles.filter((p) => p.role === 'student')
      const profMap = Object.fromEntries(db.profiles.map((p) => [p.id, p]))
      const contMap = Object.fromEntries(db.content_items.map((c) => [c.id, c]))

      const quizResults = db.quiz_results.map((q) => ({
        ...q,
        profiles: profMap[q.user_id] || { full_name: 'Talaba', group_name: '', avatar_emoji: '🎯' },
        content_items: contMap[q.content_item_id] || { title: `Mavzu ${q.topic_id}` },
      }))

      const practiceResults = db.practice_results.map((pr) => ({
        ...pr,
        content_items: contMap[pr.content_item_id] || { title: `Amaliyot ${pr.topic_id}` },
      }))

      return {
        success: true,
        data: { success: true, students, quizResults, practiceResults } as T,
      }
    }

    default:
      return { success: false, error: `Noma'lum amal: ${action}` }
  }
}

// ─── HIGH LEVEL DATABASE EXPORT ───
export const googleSheetsDb = {
  getSpreadsheetUrl: () => SPREADSHEET_URL,
  getSpreadsheetId: () => SPREADSHEET_ID,
  getApiUrl: getGoogleSheetsApiUrl,
  setApiUrl: setGoogleSheetsApiUrl,
  isConnected: isGoogleSheetsConnected,

  ping: async () => {
    const apiUrl = getGoogleSheetsApiUrl()
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}?action=ping`, { redirect: 'follow' })
        const json = await res.json()
        if (json.success) {
          return { success: true, data: json }
        }
      } catch (e) {
        console.warn('Ping GET error, trying fallback:', e)
      }
    }
    return apiRequest<{ success: boolean; message: string; spreadsheetId: string; spreadsheetName?: string }>('ping')
  },

  initDb: async () => {
    return apiRequest<{ success: boolean; message: string; sheets: string[] }>('init')
  },

  // Auth
  signUp: async (email: string, password: string, fullName: string, groupName: string = '', role: UserRole = 'student') => {
    return apiRequest<{ user: { id: string; email: string }; profile: Profile }>('signUp', {
      email,
      password,
      fullName,
      groupName,
      role,
    })
  },

  signIn: async (email: string, password: string) => {
    return apiRequest<{ user: { id: string; email: string }; profile: Profile }>('signIn', {
      email,
      password,
    })
  },

  getProfile: async (userId: string) => {
    return apiRequest<{ profile: Profile }>('getProfile', { userId })
  },

  updateProfile: async (userId: string, updates: Partial<Profile>) => {
    return apiRequest<{ message: string }>('updateProfile', { userId, ...updates })
  },

  // Diagnostic
  completeDiagnostic: async (userId: string, score: number, total: number, answers: unknown[] = []) => {
    return apiRequest<{ message: string }>('completeDiagnostic', { userId, score, total, answers })
  },

  // Results
  saveQuizResult: async (userId: string, topicId: number, partId: number, score: number, totalQuestions: number, contentItemId: string | null = null) => {
    return apiRequest<{ id: string; xpEarned: number }>('saveQuizResult', {
      userId,
      topicId,
      partId,
      score,
      totalQuestions,
      contentItemId,
    })
  },

  savePracticeResult: async (userId: string, topicId: number, score: number, maxScore: number, contentItemId: string | null = null) => {
    return apiRequest<{ id: string; xpEarned: number }>('savePracticeResult', {
      userId,
      topicId,
      score,
      maxScore,
      contentItemId,
    })
  },

  getLeaderboard: async () => {
    const res = await apiRequest<{ leaderboard: LeaderboardEntry[] }>('getLeaderboard')
    return res.data?.leaderboard || []
  },

  // Content
  getContentItems: async (type?: ContentType, status?: string) => {
    const res = await apiRequest<{ items: ContentItem[] }>('getContentItems', { type, status })
    return res.data?.items || []
  },

  getContentItem: async (id: string) => {
    const res = await apiRequest<{ item: ContentItem | null }>('getContentItem', { id })
    return res.data?.item || null
  },

  saveContentItem: async (payload: Partial<ContentItem>) => {
    return apiRequest<{ id: string; message: string }>('saveContentItem', payload)
  },

  deleteContentItem: async (id: string) => {
    return apiRequest<{ message: string }>('deleteContentItem', { id })
  },

  // Submissions & Files
  uploadSubmission: async (userId: string, contentItemId: string, file: File) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      const reader = new FileReader()
      reader.onload = async () => {
        const fileData = reader.result as string
        const res = await apiRequest<{ id: string; message: string }>('uploadSubmission', {
          userId,
          contentItemId,
          fileName: file.name,
          fileSize: file.size,
          fileData,
        })
        if (res.success) {
          resolve({ success: true })
        } else {
          resolve({ success: false, error: res.error })
        }
      }
      reader.onerror = () => resolve({ success: false, error: 'Faylni o\'qishda xatolik yuz berdi' })
      reader.readAsDataURL(file)
    })
  },

  getSubmissions: async (filters: { status?: string; group?: string; contentItemId?: string } = {}) => {
    const res = await apiRequest<{ submissions: SubmissionWithProfile[] }>('getSubmissions', filters)
    return res.data?.submissions || []
  },

  getMySubmissions: async (userId: string) => {
    const res = await apiRequest<{ submissions: any[] }>('getMySubmissions', { userId })
    return res.data?.submissions || []
  },

  gradeSubmission: async (submissionId: string, score: number, feedback: string, gradedBy: string = '') => {
    return apiRequest<{ message: string }>('gradeSubmission', {
      submissionId,
      score,
      feedback,
      gradedBy,
    })
  },

  downloadFile: async (submissionId: string) => {
    return apiRequest<{ fileName: string; fileData: string; fileSize: number }>('downloadFile', { submissionId })
  },

  // Role Requests
  submitRoleRequest: async (userId: string) => {
    return apiRequest<{ id: string; message: string }>('submitRoleRequest', { userId })
  },

  getRoleRequests: async () => {
    const res = await apiRequest<{ requests: RoleRequestWithProfile[] }>('getRoleRequests')
    return res.data?.requests || []
  },

  getMyRoleRequest: async (userId: string) => {
    const res = await apiRequest<{ request: RoleRequest | null }>('getMyRoleRequest', { userId })
    return res.data?.request || null
  },

  reviewRoleRequest: async (requestId: string, approved: boolean, reviewerId: string = '') => {
    return apiRequest<{ message: string }>('reviewRoleRequest', {
      requestId,
      approved,
      reviewerId,
    })
  },

  // Users & Admin
  getUsers: async () => {
    const res = await apiRequest<{ users: Profile[] }>('getUsers')
    return res.data?.users || []
  },

  setUserRole: async (userId: string, role: UserRole) => {
    return apiRequest<{ message: string }>('setUserRole', { userId, role })
  },

  // Teacher Data
  getTeacherData: async () => {
    const res = await apiRequest<{
      students: Profile[]
      quizResults: any[]
      practiceResults: any[]
    }>('getTeacherData')
    return res.data || { students: [], quizResults: [], practiceResults: [] }
  },
}
